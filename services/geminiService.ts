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

const UNREACHABLE = "yefris went for a walk. he cannot be reached at this time.";

// The server answers in one piece; this generator typewriters it for the UI.
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

    const data = await response.json().catch(() => null);

    if (!response.ok || !data) {
      yield { type: 'error', error: data?.error || UNREACHABLE };
      return;
    }

    const chars = Array.from((data.text as string) || '');
    // Fast sweep: ~40 ticks at 4ms each = ~160ms total visual delay (snappy, not sluggish)
    const batchSize = Math.max(1, Math.ceil(chars.length / 40));

    for (let i = 0; i < chars.length; i += batchSize) {
      if (signal?.aborted) return;
      yield { type: 'content', text: chars.slice(i, i + batchSize).join('') };
      await new Promise(resolve => setTimeout(resolve, 4));
    }

    if (data.meta) yield { type: 'metadata', _oracle_meta: data.meta };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('Yefris stream aborted gracefully.');
      return;
    }
    console.error("Error asking Yefris:", error);
    yield { type: 'error', error: UNREACHABLE };
  }
}
