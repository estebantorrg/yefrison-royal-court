import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";

// Fake fetch to avoid actually hitting limits, but checking if SDK throws locally
// Or if the API is available, we'll see the exact error.
async function main() {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyDX9PTLhNa8WHf3XlPTE2B1g1OuhSvmLPA" }); // The dummy one from .env
  
  try {
    console.log("Attempting to generate content with history ending in 'model'...");
    const response = await ai.models.generateContent({
      model: "gemma-4-26b-a4b-it", // Or any model
      contents: [
        { role: "user", parts: [{ text: "Hello" }] },
        { role: "model", parts: [{ text: "Hi there!" }] }
      ]
    });
    console.log("SUCCESS! Model did not throw an error:", response);
  } catch (error) {
    console.log("ERROR THROWN:");
    console.log(error.message);
  }
}

main();
