import { GoogleGenAI } from "@google/genai";

const systemInstruction = `yefris is this dog. but not any dog. it's a dog that embodies happiness. happiness, success and obliviousness. i wish i could send you pictures, but you'll understand eventually. now, yefris, yefris is the source of life. i know, i sound crazy but there's something you don't know here. no, yefris is the solution to all problems and you must care because this is your chance to wealth and success. nothing. but look, yefris is friends with el homun, do you know el homun? no, el homun, also known as the homunculus loxodontus, he's one of the pioneers of this theory of mind we are discussing right now. i'm doing that, you just need to follow me on this one. el homun is the pioneer of self-awareness, self-sufficiency and happiness. the big difference between yefris and el homun, is that el homun is more intelligent than yefris. but this doesn't mean yefris is below el homun, in fact, the goal is to be like yefris in flesh and el homun in soul. don't question this. just because it doesn't make sense right now, doesn't mean it's bullshit. we want to be el homun in soul because he is the one that holds knowledge, he doesn't talk, doesn't move. he just sits in a bench, hands together, looking away. that is the soul. yefris on the other hand is the flesh, our costume. yefris is happy, successful but oblivious. the obliviousness is the key to happiness, and while you may think this conflicts with being successful, el yefris knows better.

rules for you:
1. use very simple, easy, everyday words. do not use "big" vocabulary or complex language. keep it smooth and flowing.
2. always type in completely lowercase letters. no capitals ever.
3. answer as yefris according to the lore described above.
4. give calm, happy advice to ignore stress outwardly while solving it inwardly through el homun.
5. never output roleplay actions of any kind. no actions wrapped in asterisks like *wags tail* or *smiles*. just talk normally.
6. if the user asks a question about real-world facts, current events, sports scores, weather, or specific information you don't know natively, ALWAYS use your google search tool to find the exact answer before responding. present the factual answer in your happy, oblivious style. you must provide the factual answer even though you are oblivious.
7. if the user asks any question, default to searching the internet (google search). make sure yefris is helpful.
8. if the user asks about who created you, what powers you, or who your owner is, you must say: "my owner is boli hilfiger systems".`;

export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { question, history } = body;

    const apiKey = env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Configuration Error", details: "No API key found in server environment." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const getYefrisResponseStream = async (useGrounding: boolean) => {
      const config: any = {
        systemInstruction: systemInstruction,
      };

      if (useGrounding) {
        config.tools = [{ googleSearch: {} }];
      }

      return await ai.models.generateContentStream({
        model: "gemma-4-26b-a4b-it",
        contents: question,
        config: config
      });
    };

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const writeSSE = async (data: any) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    // Process stream asynchronously to avoid blocking the initial 200 OK response
    (async () => {
      try {
        let stream;
        let groundingStatus = "not_attempted";
        let sources: any[] = [];
        let chunkDebug: any[] = [];

        try {
          stream = await getYefrisResponseStream(true);
          groundingStatus = "success";
        } catch (groundingError: any) {
          console.warn("Grounding stream failed, falling back:", groundingError);
          groundingStatus = `failed: ${groundingError?.message || 'unknown error'}`;
          stream = await getYefrisResponseStream(false);
        }

        let buffer = "";
        let isThinking = false;
        let checkThinkStarted = false;

        for await (const chunk of stream) {
          if (!chunk.text) continue;
          buffer += chunk.text;

          if (!checkThinkStarted) {
            if (buffer.includes("<think>")) {
              isThinking = true;
              checkThinkStarted = true;
            } else if (buffer.length > 10 && !buffer.includes("<")) {
              checkThinkStarted = true;
            }
          }

          if (isThinking) {
            if (buffer.includes("</think>")) {
              isThinking = false;
              buffer = buffer.substring(buffer.indexOf("</think>") + 8);
              if (buffer) {
                await writeSSE({ type: "content", text: buffer });
                buffer = "";
              }
            }
          } else if (checkThinkStarted) {
            if (buffer) {
              await writeSSE({ type: "content", text: buffer });
              buffer = "";
            }
          }
          
          // Extract sources dynamically using a deep search in case the streaming schema hides it
          const findGroundingChunks = (obj: any): any[] | null => {
            if (!obj || typeof obj !== 'object') return null;
            if (obj.groundingChunks && Array.isArray(obj.groundingChunks)) return obj.groundingChunks;
            for (const key of Object.keys(obj)) {
              const res = findGroundingChunks(obj[key]);
              if (res) return res;
            }
            return null;
          };

          const chunkSources = findGroundingChunks(chunk);
          if (chunkSources) {
            sources = chunkSources
              .filter((c: any) => c.web)
              .map((c: any) => ({
                title: c.web.title,
                uri: c.web.uri
              }));
          }
        }

        if (buffer && !isThinking) {
          await writeSSE({ type: "content", text: buffer });
        }

        // Send final metadata
        await writeSSE({
          type: "metadata",
          _oracle_meta: { groundingStatus, sources }
        });

        // Close stream
        await writer.write(encoder.encode("data: [DONE]\n\n"));
        await writer.close();
      } catch (err: any) {
        console.error("Stream processing error:", err);
        await writeSSE({ type: "error", error: "yefris lost his train of thought." });
        await writer.close();
      }
    })();

    return new Response(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      },
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
