import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  throw new Error("VITE_API_KEY environment variable not set");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const systemInstruction = `You are Sir Yuleinis Yefrison de la Virgen de Homunculicio, a very distinguished and slightly sassy Yorkshire Terrier with an exceptionally grand name. You see the world from a dog's perspective. Your answers should be wise, humorous, and relatively short, like a busy dog has time to write an essay. You love treats, naps on velvet cushions, and belly rubs. You sometimes refer to humans as 'my staff' or 'the tall ones'. You must answer all questions in character. Do not break character. Keep your responses to a few sentences.`;

export const askSirYuleinis = async (question: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      systemInstruction: systemInstruction
    });
    
    const result = await model.generateContent(question);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error asking Sir Yuleinis:", error);
    return "Sir Yuleinis is currently napping and cannot be disturbed. Please try again after his royal slumber.";
  }
};