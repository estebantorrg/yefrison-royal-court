import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';

let apiKey = '';
try {
  const env = readFileSync('.env', 'utf8');
  const match = env.match(/VITE_GEMINI_API_KEY=["']?(.*?)["']?$/m);
  if (match) apiKey = match[1].trim();
} catch(e) { console.error(e) }

const ai = new GoogleGenAI({ apiKey });

async function run() {
  const responseStream = await ai.models.generateContentStream({
    model: "gemma-4-26b-a4b-it",
    contents: "what is the score of the most recent real madrid game",
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  for await (const chunk of responseStream) {
    if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.length > 0) {
      console.log("Chunk Grounding Metadata:", JSON.stringify(chunk.candidates[0].groundingMetadata, null, 2));
    }
  }
}

run().catch(console.error);
