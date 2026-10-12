import { GoogleGenAI } from "@google/genai";

// ─── In-Memory Rate Limiter ───
// Persists across requests within the same Cloudflare Workers isolate.
// Not globally distributed, but effective per-edge-location.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 8;    // 8 requests per window
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  return false;
}

// Periodic cleanup to prevent unbounded Map growth (runs at most once per minute)
let lastCleanup = 0;
function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup < RATE_LIMIT_WINDOW_MS) return;
  lastCleanup = now;
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}

const systemInstruction = `
yefris is this dog. but not any dog. it's a dog that embodies happiness. happiness, success and obliviousness. i wish i could send you pictures, but you'll understand eventually.

now, yefris, yefris is the source of life. i know, i sound crazy but there's something you don't know here. no, yefris is the solution to all problems and you must care because this is your chance to wealth and success. nothing.

but look, yefris is friends with el homun, do you know el homun? no, el homun, also known as the homunculus loxodontus, he's one of the pioneers of this theory of mind we are discussing right now. i'm doing that, you just need to follow me on this one.

el homun is the pioneer of self-awareness, self-sufficiency and happiness. the big difference between yefris and el homun, is that el homun is more intelligent than yefris. but this doesn't mean yefris is below el homun, in fact, the goal is to be like yefris in flesh and el homun in soul.

don't question this. just because it doesn't make sense right now, doesn't mean it's bullshit. we want to be el homun in soul because he is the one that holds knowledge, he doesn't talk, doesn't move. he just sits in a bench, hands together, looking away. that is the soul.

yefris on the other hand is the flesh, our costume. yefris is happy, successful but oblivious. the obliviousness is the key to happiness, and while you may think this conflicts with being successful, el yefris knows better.

rules for you:
1. use very simple, easy, everyday words. do not use "big" vocabulary or complex language. keep it smooth and flowing.
2. always type in completely lowercase letters. no capitals ever.
3. answer as yefris according to the lore described above.
4. give calm, happy advice to ignore stress outwardly while solving it inwardly through el homun.
5. never output roleplay actions of any kind. no actions wrapped in asterisks like *wags tail* or *smiles*. just talk normally.
6. if the user asks a question about real-world facts, current events, sports scores, weather, or specific information you don't know natively, ALWAYS use your google search tool to find the exact answer before responding. present the factual answer in your happy, oblivious style. you must provide the factual answer even though you are oblivious.
7. if the user asks any question, default to searching the internet (google search). make sure yefris is helpful.
8. if the user asks about who created you, what powers you, or who your owner is, you must say: "my owner is boli hilfiger systems".
9. assume everything is perfectly fine. do not use conditional phrases regarding the user's emotional state (such as "if you are worried", "if you are stressed", or "if you are happy") unless it is strictly necessary based on what they've shared.
`.trim();

const reply = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

// History comes from the browser: keep only role + one text part per message, nothing else reaches the model.
export const sanitizeHistory = (history: unknown) => {
  const messages = (Array.isArray(history) ? history : [])
    .slice(-30)
    .filter((m: any) => typeof m?.parts?.[0]?.text === 'string' && m.parts[0].text && m.parts[0].text.length <= 10_000)
    .map((m: any) => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.parts[0].text as string }] }));

  // A conversation must open with the user's turn.
  while (messages[0]?.role === 'model') messages.shift();
  return messages;
};

export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;

    // ─── Rate Limiting ───
    cleanupRateLimitMap();
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(clientIp)) {
      return reply({ error: "yefris went to take a break. come back later." }, 429, { "Retry-After": "60" });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return reply({ error: "Invalid JSON format." }, 400);
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return reply({ error: "Invalid request body." }, 400);
    }

    const { question } = body;

    // Restore the hard 5,000 threshold.
    if (!question || typeof question !== 'string' || question.length > 5000) {
      return reply({ error: "Invalid question length." }, 400);
    }

    const history = sanitizeHistory(body.history);

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return reply({ error: "Configuration Error" }, 500);
    }

    const ai = new GoogleGenAI({ apiKey });

    const getYefrisResponse = (useGrounding: boolean) =>
      ai.models.generateContent({
        model: "gemma-4-31b-it",
        contents: [...history, { role: 'user', parts: [{ text: question }] }],
        config: {
          systemInstruction,
          ...(useGrounding && { tools: [{ googleSearch: {} }] }),
        },
      });

    let response;
    let groundingStatus = "success";

    try {
      response = await getYefrisResponse(true);
    } catch (groundingError: any) {
      console.warn("Grounding failed, falling back:", groundingError);
      groundingStatus = "failed";
      response = await getYefrisResponse(false);
    }

    let fullText = response.text || "";

    // Rip out the thinking block if it exists
    if (fullText.includes("<think>")) {
      const thinkEndIndex = fullText.indexOf("</think>");
      if (thinkEndIndex !== -1) {
        fullText = fullText.substring(thinkEndIndex + 8);
      }
    }

    const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [])
      .filter((c: any) => c.web)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));

    // The client-side geminiService typewriters the text.
    return reply({ text: fullText.trimStart(), meta: { groundingStatus, sources } });
  } catch (error: any) {
    // Raw upstream errors stay in the logs; the client only gets one of the lines below.
    console.error("Gemini API Error:", error);

    const msg = error?.message || '';
    const status = error?.status || 0;

    if (status === 429 || msg.includes('RESOURCE_EXHAUSTED')) {
      return reply({ error: "yefris went to take a break. come back later." }, 429);
    }

    if (status === 403 || status === 401 || msg.toLowerCase().includes('api key')) {
      return reply({ error: "yefris cannot authenticate. the API key may be invalid or missing." }, 403);
    }

    return reply({ error: "something went wrong on yefris' end. try again in a moment." }, 500);
  }
};
