// Leaderboard API — validates signed game session tokens
import { sessionAgeMs } from './game-session.ts';

// ─── In-Memory Rate Limiter ───
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 15;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

let lastCleanup = 0;
function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup < RATE_LIMIT_WINDOW_MS) return;
  lastCleanup = now;
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}

// Allowlist of known games — prevents arbitrary KV key namespace pollution.
// The value is the fastest a game can award one point (ms): defense drops a 10-point
// target every 400ms at most, burden locks 250ms per card, flappy spawns a pillar every 800ms at most.
const MS_PER_POINT: Record<string, number> = { defense: 40, burden: 250, flappy: 800 };
const SESSION_MAX_AGE_MS = 3_600_000;

const reply = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

const gameIdOf = (game: unknown) => (typeof game === 'string' && Object.hasOwn(MS_PER_POINT, game) ? game : "defense");
const kvKeyOf = (gameId: string) => (gameId === "defense" ? "top_scores" : `top_scores_${gameId}`);

async function readBoard(kv: any, kvKey: string): Promise<{name: string, score: number}[]> {
  try {
    let textData = await kv.get(kvKey, { type: "text" });
    if (!textData) return [];
    if (!textData.trim().startsWith('[')) {
      textData = `[${textData}]`;
    }
    const data = JSON.parse(textData);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("KV parsing failed", e);
    return [];
  }
}

export const onRequestGet = async (context: any) => {
  const { request, env } = context;

  if (!env.LEADERBOARD_KV) {
    return reply({ error: "Leaderboard is not configured" }, 500);
  }

  try {
    const gameId = gameIdOf(new URL(request.url).searchParams.get("game"));
    return reply(await readBoard(env.LEADERBOARD_KV, kvKeyOf(gameId)));
  } catch (error) {
    return reply({ error: "Failed to fetch leaderboard" }, 500);
  }
};

export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  try {
    // Rate limiting
    cleanupRateLimitMap();
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(clientIp)) {
      return reply({ error: "Too many submissions. Try again later." }, 429, { "Retry-After": "60" });
    }

    if (!env.LEADERBOARD_KV || !env.SESSION_SECRET) {
      console.error("LEADERBOARD_KV or SESSION_SECRET is not set");
      return reply({ error: "Leaderboard is not configured" }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return reply({ error: "Invalid JSON format" }, 400);
    }

    const { name, score, sessionId, game } = body ?? {};
    const gameId = gameIdOf(game);
    const kvKey = kvKeyOf(gameId);

    // ─── Input Validation ───
    if (!name || typeof name !== 'string' || name.length > 20) {
      return reply({ error: "Invalid name" }, 400);
    }
    if (!Number.isInteger(score) || score < 0 || score > 50000) {
      return reply({ error: "Invalid or impossible score" }, 400);
    }

    // ─── Server-Side Session Validation ───
    if (!sessionId || typeof sessionId !== 'string') {
      return reply({ error: "Missing game session" }, 403);
    }

    const sessionAge = await sessionAgeMs(env.SESSION_SECRET, sessionId);
    if (sessionAge === null || sessionAge < 0) {
      return reply({ error: "Invalid game session" }, 403);
    }
    if (sessionAge > SESSION_MAX_AGE_MS) {
      return reply({ error: "Game session expired. Play again to submit." }, 403);
    }
    // A score cannot be higher than the time played allows.
    if (score > sessionAge / MS_PER_POINT[gameId]) {
      return reply({ error: "Invalid or impossible score" }, 400);
    }

    // ─── Leaderboard Update ───
    // shortcut: KV has no locks, so two submissions in the same moment can overwrite each other; move to D1 or a Durable Object if traffic grows.
    const newEntry = { name: name.trim() || 'Anonymous', score };
    let currentLeaderboard = await readBoard(env.LEADERBOARD_KV, kvKey);

    // Insert or update (keep highest)
    const existingIndex = currentLeaderboard.findIndex(e => e.name.toLowerCase() === newEntry.name.toLowerCase());
    if (existingIndex !== -1) {
      if (newEntry.score > currentLeaderboard[existingIndex].score) {
        currentLeaderboard[existingIndex] = newEntry;
      }
    } else {
      currentLeaderboard.push(newEntry);
    }

    currentLeaderboard.sort((a, b) => b.score - a.score);
    currentLeaderboard = currentLeaderboard.slice(0, 10);

    await env.LEADERBOARD_KV.put(kvKey, JSON.stringify(currentLeaderboard));

    return reply({ success: true, leaderboard: currentLeaderboard });

  } catch (error) {
    return reply({ error: "Failed to process score" }, 500);
  }
};
