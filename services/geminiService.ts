export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface OracleMeta {
  groundingStatus: string;
  sources: Array<{ title: string; uri: string }>;
}

export interface OracleResponse {
  answer: string;
  meta: OracleMeta;
}

export const askYefris = async (question: string, history: ChatMessage[] = []): Promise<OracleResponse> => {
  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, history }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      answer: data.answer || "yefris remains silent. silence is oblivious joy.",
      meta: data._oracle_meta || { groundingStatus: 'unavailable', sources: [] }
    };
  } catch (error: any) {
    console.error("Error asking Yefris:", error);
    throw new Error(error?.message || "yefris went for a walk. he cannot be reached at this time.");
  }
};