import { GoogleGenAI } from '@google/genai';

const apiKey = "AIzaSyDX9PTLhNa8WHf3XlPTE2B1g1OuhSvmLPA";
const ai = new GoogleGenAI({ apiKey });

async function run() {
  const responseStream = await ai.models.generateContentStream({
    model: "gemma-4-26b-a4b-it",
    contents: "what was the score of the last bayern munich game yefris?",
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  for await (const chunk of responseStream) {
    if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].groundingMetadata) {
      console.log("Found metadata in chunk!");
      console.log(JSON.stringify(chunk.candidates[0].groundingMetadata, null, 2));
    }
  }
}

run().catch(console.error);
