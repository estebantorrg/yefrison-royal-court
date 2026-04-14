export const askYefris = async (question: string): Promise<string> => {
  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.answer || "yefris remains silent. silence is oblivious joy.";
  } catch (error: any) {
    console.error("Error asking Yefris:", error);
    throw new Error(error?.message || "yefris went for a walk. he cannot be reached at this time.");
  }
};