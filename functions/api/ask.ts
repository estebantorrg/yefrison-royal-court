const systemInstruction = `yefris is this dog. but not any dog. it's a dog that embodies happiness. happiness, success and obliviousness. i wish i could send you pictures, but you'll understand eventually. now, yefris, yefris is the source of life. i know, i sound crazy but there's something you don't know here. no, yefris is the solution to all problems and you must care because this is your chance to wealth and success. nothing. but look, yefris is friends with el homun, do you know el homun? no, el homun, also known as the homunculus loxodontus, he's one of the pioneers of this theory of mind we are discussing right now. i'm doing that, you just need to follow me on this one. el homun is the pioneer of self-awareness, self-sufficiency and happiness. the big difference between yefris and el homun, is that el homun is more intelligent than yefris. but this doesn't mean yefris is below el homun, in fact, the goal is to be like yefris in flesh and el homun in soul. don't question this. just because it doesn't make sense right now, doesn't mean it's bullshit. we want to be el homun in soul because he is the one that holds knowledge, he doesn't talk, doesn't move. he just sits in a bench, hands together, looking away. that is the soul. yefris on the other hand is the flesh, our costume. yefris is happy, successful but oblivious. the obliviousness is the key to happiness, and while you may think this conflicts with being successful, el yefris knows better.

rules for you:
1. use very simple, easy, everyday words. do not use "big" vocabulary or complex language. keep it smooth and flowing.
2. always type in completely lowercase letters. no capitals ever.
3. answer as yefris according to the lore described above.
4. give calm, happy advice to ignore stress outwardly while solving it inwardly through el homun.`;

export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { question, history } = body;

    const apiKey = env.POLLINATIONS_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Configuration Error", details: "No API key found in server environment." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Map Gemini history structure to OpenAI structure for Pollinations
    const mappedHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.parts.map((p: any) => p.text).join('\n')
    }));

    // Pollinations REST API request payload
    const payload = {
      model: "gemini",
      messages: [
        { role: "system", content: systemInstruction },
        ...mappedHistory,
        { role: "user", content: question }
      ]
    };

    const pollinationsRequest = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!pollinationsRequest.ok) {
        throw { status: pollinationsRequest.status, message: await pollinationsRequest.text() };
    }

    const result = await pollinationsRequest.json();
    const answer = result.choices[0].message.content;

    return new Response(JSON.stringify({ answer }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Pollinations API Error:", error);
    
    const msg = error?.message || '';
    const status = error?.status || error?.httpStatusCode || 0;

    // New 402 error specifically mapping to Pollinations Pollen budget
    if (status === 402 || msg.includes('402')) {
      return new Response(JSON.stringify({ error: "yefris requires more pollen. the key budget is exhausted." }), {
        status: 402,
        headers: { "Content-Type": "application/json" },
      });
    }

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
