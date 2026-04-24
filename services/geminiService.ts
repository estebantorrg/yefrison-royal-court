export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface OracleMeta {
  groundingStatus: string;
  sources: Array<{ title: string; uri: string }>;
}

export type StreamUpdate = 
  | { type: 'content', text: string }
  | { type: 'metadata', _oracle_meta: OracleMeta }
  | { type: 'error', error: string };

export async function* askYefrisStream(question: string, history: ChatMessage[] = [], signal?: AbortSignal): AsyncGenerator<StreamUpdate, void, unknown> {
  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, history }),
      signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        yield { type: 'error', error: "yefris went to take a break. come back later." };
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      if (signal?.aborted) return;

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      
      // Keep the last partial event in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.startsWith('data: ') ? line.slice(6).trim() : line.trim();
          if (dataStr === '[DONE]') {
            return;
          }
          
          try {
            const data: StreamUpdate = JSON.parse(dataStr);
            
            if (data.type === 'content' && data.text) {
              const chars = Array.from(data.text);
              // Dynamic accelerator: sweep the full text linearly over roughly ~80 ticks (max 1.2 seconds visual wait)
              const batchSize = Math.max(1, Math.ceil(chars.length / 80)); 
              
              for (let i = 0; i < chars.length; i += batchSize) {
                if (signal?.aborted) return;
                const batch = chars.slice(i, i + batchSize).join('');
                yield { type: 'content', text: batch };
                await new Promise(resolve => setTimeout(resolve, 10)); // Hyper-fluid 10ms frame
              }
            } else {
              yield data;
            }
          } catch (e) {
            console.error("Failed to parse SSE JSON:", dataStr);
          }
        }
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('Yefris stream aborted gracefully.');
      return; 
    }
    console.error("Error asking Yefris:", error);
    yield { type: 'error', error: error?.message || "yefris went for a walk. he cannot be reached at this time." };
  }
}