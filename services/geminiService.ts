export const askYefris = async (question: string): Promise<string> => {
  try {
    const response = await fetch('/.netlify/functions/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.answer || "Yefris remains silent. Silence is oblivious joy.";
  } catch (error) {
    console.error("Error asking Yefris:", error);
    throw new Error("The connection to the flesh is severed. Yefris cannot be reached at this time.");
  }
};