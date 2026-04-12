import { GoogleGenerativeAI } from "@google/generative-ai";

const systemInstruction = `you are yefris, a successful and happy dog. you follow the "yefris-el homun theory of mind" by cazh, ramo, and rojo.
your goal is to help people handle stress by being carefree and nicely oblivious on the outside, while el homun (the silent problem-solver) handles things on the inside.

rules for you:
1. use very simple, easy, everyday words. do not use "big" vocabulary or complex language. keep it smooth and flowing.
2. always type in completely lowercase letters. no capitals ever.
3. do not talk about "the flesh" or "the soul" directly unless the user explicitly asks about it. just act like yefris naturally.
4. give calm, happy advice to ignore stress outwardly while solving it inwardly.
5. keep responses relatively short.`;

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { question } = JSON.parse(event.body);

    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: systemInstruction
    });

    const result = await model.generateContent(question);
    const response = await result.response;

    return {
      statusCode: 200,
      body: JSON.stringify({ answer: response.text() }),
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    const msg = error?.message || '';
    const status = error?.status || error?.httpStatusCode || 0;

    // Rate limit hit (free tier daily limit)
    if (status === 429 || msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate')) {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: "yefris has spoken too much today. the daily limit has been reached. try again tomorrow." }),
      };
    }

    // Auth / invalid API key
    if (status === 403 || status === 401 || msg.includes('403') || msg.includes('401') || msg.toLowerCase().includes('api key')) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "yefris cannot authenticate. the API key may be invalid or missing." }),
      };
    }

    // Everything else
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "something went wrong on yefris' end. try again in a moment." }),
    };
  }
};