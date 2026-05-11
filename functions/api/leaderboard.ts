// Mock in-memory store for dev/testing when KV isn't bound yet
let mockLeaderboard: {name: string, score: number}[] = [];

// ─── In-Memory Rate Limiter ───
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 15; // 15 POST submissions per minute per IP
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

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequestOptions = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const onRequestGet = async (context: any) => {
  const { env } = context;

  try {
    let topScores: {name: string, score: number}[] = [];

    if (env.LEADERBOARD_KV) {
      try {
        let textData = await env.LEADERBOARD_KV.get("top_scores", { type: "text" });
        if (textData) {
          if (!textData.trim().startsWith('[')) {
            textData = `[${textData}]`; // Auto-fix missing brackets
          }
          const data = JSON.parse(textData);
          topScores = Array.isArray(data) ? data : [];
        }
      } catch (e) {
        console.error("KV parsing failed on GET, falling back to empty array", e);
        topScores = [];
      }
    } else {
      topScores = mockLeaderboard;
    }

    return new Response(JSON.stringify(topScores), {
      status: 200,
      headers: CORS_HEADERS,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch leaderboard" }), { status: 500, headers: CORS_HEADERS });
  }
};

export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  try {
    // Rate limiting
    cleanupRateLimitMap();
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({ error: "Too many submissions. Try again later." }), {
        status: 429,
        headers: { ...CORS_HEADERS, "Retry-After": "60" },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON format" }), { status: 400, headers: CORS_HEADERS });
    }

    const { name, score, timestamp, hash } = body;

    if (!name || typeof name !== 'string' || name.length > 20) {
      return new Response(JSON.stringify({ error: "Invalid name" }), { status: 400, headers: CORS_HEADERS });
    }
    if (typeof score !== 'number' || score < 0 || score > 50000) {
      return new Response(JSON.stringify({ error: "Invalid or impossible score" }), { status: 400, headers: CORS_HEADERS });
    }

    // Time window check (2 minutes = 120000 ms)
    const now = Date.now();
    if (!timestamp || Math.abs(now - timestamp) > 120000) {
      return new Response(JSON.stringify({ error: "Request expired or invalid timestamp" }), { status: 403, headers: CORS_HEADERS });
    }

    // Hash signature check (Anti-Cheat)
    const encoder = new TextEncoder();
    const data = encoder.encode(`${name}:${score}:${timestamp}:YEFRIS_SECRET_SALT_V1`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hash !== expectedHash) {
      return new Response(JSON.stringify({ error: "Invalid signature payload" }), { status: 403, headers: CORS_HEADERS });
    }

    const newEntry = { name: name.trim() || 'Anonymous', score };
    let currentLeaderboard: {name: string, score: number}[] = [];

    if (env.LEADERBOARD_KV) {
      try {
        let textData = await env.LEADERBOARD_KV.get("top_scores", { type: "text" });
        if (textData) {
          if (!textData.trim().startsWith('[')) {
            textData = `[${textData}]`; // Auto-fix missing brackets
          }
          const parsedData = JSON.parse(textData);
          currentLeaderboard = Array.isArray(parsedData) ? parsedData : [];
        }
      } catch (e) {
        console.error("KV parsing failed on POST, overwriting with new valid array", e);
        currentLeaderboard = [];
      }
    } else {
      currentLeaderboard = [...mockLeaderboard];
    }

    // Insert or update existing score (keep highest)
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

    // Save
    if (env.LEADERBOARD_KV) {
      await env.LEADERBOARD_KV.put("top_scores", JSON.stringify(currentLeaderboard));
    } else {
      mockLeaderboard = currentLeaderboard;
    }

    return new Response(JSON.stringify({ success: true, leaderboard: currentLeaderboard }), {
      status: 200,
      headers: CORS_HEADERS,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to process score" }), { status: 500, headers: CORS_HEADERS });
  }
};
