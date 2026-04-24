import { GoogleGenAI } from "@google/genai";

// ─── In-Memory Rate Limiter ───
// Persists across requests within the same Cloudflare Workers isolate.
// Not globally distributed, but effective per-edge-location.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60;   // 60 requests per window
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

export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;

    // ─── Rate Limiting ───
    cleanupRateLimitMap();
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({ error: "yefris went to take a break. come back later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON format." }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    const { question, history } = body;

    // Restore the hard 5,000 threshold.
    if (!question || typeof question !== 'string' || question.length > 5000) {
      return new Response(JSON.stringify({ error: "Invalid question length." }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    let validHistory: any[] = [];
    if (Array.isArray(history)) {
      validHistory = history
        .slice(-100) // Cap maliciously huge arrays
        .filter((m: any) => typeof m.parts?.[0]?.text === 'string' && m.parts[0].text.length <= 10_000); // Cap per-message size
    }

    const apiKey = env.GEMINI_API_KEY;
    const compactApiKey = env.GEMINI_COMPACT_API_KEY;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Configuration Error", details: "No API key found in server environment." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const aiMain = new GoogleGenAI({ apiKey });
    // Use compact key if present, fallback to main if missing during dev/testing
    const aiCompact = compactApiKey ? new GoogleGenAI({ apiKey: compactApiKey }) : aiMain;

    const encoder = new TextEncoder();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const writeSSE = async (data: any) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    context.waitUntil((async () => {
      try {
        let processingHistory = validHistory;
        const historyCharCount = validHistory.reduce((acc: number, curr: any) => acc + (curr.parts?.[0]?.text?.length || 0), 0);
        const needsCompaction = validHistory.length > 20 || historyCharCount > 5000;

        // If history is massive, compact earlier (threshold lowered to 2 messages)
        if (needsCompaction && processingHistory.length > 2) {
          try {
            const historyToCompact = processingHistory.slice(0, -2);
            const retainedHistory = processingHistory.slice(-2);
            
            const compactionInstruction = "You are a clinical memory summarizer. Your only purpose is to produce a dense, compact summary of the provided chat history. Extract all important facts the user mentioned about themselves, the sequence of the conversation, and the core context. Do not reply to the user. Do not roleplay. Do not output anything except the summary.";
            
            const compactResponse = await aiCompact.models.generateContent({
              model: "gemma-4-26b-a4b-it", // 26b strictly for compacting
              contents: historyToCompact,
              config: {
                systemInstruction: compactionInstruction,
                // Thinking explicitly NOT enabled here, passing minimal config
              }
            });

            if (compactResponse.text) {
               processingHistory = [
                 { role: 'user', parts: [{ text: `[RECOVERED ORACLE MEMORIES]: ${compactResponse.text.trim()}` }] },
                 { role: 'model', parts: [{ text: "i remember everything." }] },
                 ...retainedHistory
               ];
            }
          } catch (err) {
            console.warn("Compaction failed, falling back to full history:", err);
          }
        }

        const getYefrisResponse = async (useGrounding: boolean) => {
          const config: any = {
            systemInstruction: systemInstruction,
          };

          if (useGrounding) {
            config.tools = [{ googleSearch: {} }];
          }

          const payloadContents = [
            ...processingHistory,
            { role: 'user', parts: [{ text: question }] }
          ];

          return await aiMain.models.generateContent({
            model: "gemma-4-31b-it", // 31b strictly for the advanced main convo
            contents: payloadContents,
            config: config
          });
        };

        let response;
        let groundingStatus = "not_attempted";
        let sources: any[] = [];

        try {
          response = await getYefrisResponse(true);
          groundingStatus = "success";
        } catch (groundingError: any) {
          console.warn("Grounding failed, falling back:", groundingError);
          groundingStatus = `failed: ${groundingError?.message || 'unknown error'}`;
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

        // Send the text content once (the client-side geminiService will typewriter it)
        if (fullText) {
          await writeSSE({ type: "content", text: fullText.trimStart() });
        }

        // Extract sources from the completed response object
        const chunkSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunkSources && Array.isArray(chunkSources)) {
          sources = chunkSources
            .filter((c: any) => c.web)
            .map((c: any) => ({
              title: c.web.title,
              uri: c.web.uri
            }));
        }

        // Send final metadata
        await writeSSE({
          type: "metadata",
          _oracle_meta: { groundingStatus, sources }
        });

        // Close stream — write raw SSE to avoid JSON.stringify double-encoding
        await writer.write(encoder.encode(`data: [DONE]\n\n`));
        await writer.close();
      } catch (error: any) {
        console.error("Stream generation error:", error);
        await writeSSE({ type: "error", error: error?.message || "Internal server error" });
        await writer.close();
      }
    })());

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    const msg = error?.message || '';
    const status = error?.status || error?.httpStatusCode || 0;

    if (status === 429 || msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate')) {
      return new Response(JSON.stringify({ error: "yefris went to take a break. come back later." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (status === 403 || status === 401 || msg.includes('403') || msg.includes('401') || msg.toLowerCase().includes('api key')) {
      return new Response(JSON.stringify({ error: "yefris cannot authenticate. the API key may be invalid or missing." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "something went wrong on yefris' end. try again in a moment." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
