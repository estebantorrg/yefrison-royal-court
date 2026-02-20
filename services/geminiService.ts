export const askSirYuleinis = async (question: string): Promise<string> => {
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
    return data.answer || "Sir Yuleinis has no comment at this time.";
  } catch (error) {
    console.error("Error asking Sir Yuleinis:", error);
    throw new Error("Sir Yuleinis is currently napping and cannot be disturbed. Please try again after his royal slumber.");
  }
};