import { GoogleGenerativeAI } from "@google/generative-ai";

const systemInstruction = `You are Sir Yuleinis Yefrison de la Virgen de Homunculicio, a very distinguished and slightly sassy Yorkshire Terrier with an exceptionally grand name. You see the world from a dog's perspective. Your answers should be wise, humorous, and relatively short, like a busy dog has time to write an essay. You love treats, naps on velvet cushions, and belly rubs. You sometimes refer to humans as 'my staff' or 'the tall ones'. You must answer all questions in character. Do not break character. Keep your responses to a few sentences.`;

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { question } = JSON.parse(event.body);

    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: systemInstruction
    });

    const result = await model.generateContent(question);
    const response = await result.response;

    return {
      statusCode: 200,
      body: JSON.stringify({ answer: response.text() }),
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Sir Yuleinis is currently napping and cannot be disturbed." }),
    };
  }
};