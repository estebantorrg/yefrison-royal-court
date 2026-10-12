// Game Session API — stateless anti-cheat token
// Flow: Frontend calls POST /api/game-session at game start → gets a sessionId,
// which is the start time signed with SESSION_SECRET (nothing is stored).
// At game end, frontend sends sessionId with the score to /api/leaderboard.
// Backend checks the signature and rejects scores too high for the time played.

const encoder = new TextEncoder();

const hmacKey = (secret: string) =>
  crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

export const signSession = async (secret: string, createdAt: number) => {
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(String(createdAt)));
  const hex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${createdAt}.${hex}`;
};

// Age of the session in ms, or null if we did not sign this token.
export const sessionAgeMs = async (secret: string, sessionId: string): Promise<number | null> => {
  const [createdAt, hex = ''] = sessionId.split('.');
  if (!/^\d+$/.test(createdAt) || !/^[0-9a-f]{64}$/.test(hex)) return null;

  const signature = Uint8Array.from(hex.match(/../g)!, byte => parseInt(byte, 16));
  const valid = await crypto.subtle.verify('HMAC', await hmacKey(secret), signature, encoder.encode(createdAt));
  return valid ? Date.now() - Number(createdAt) : null;
};

export const onRequestPost = async (context: any) => {
  const { env } = context;

  if (!env.SESSION_SECRET) {
    console.error("SESSION_SECRET is not set");
    return new Response(JSON.stringify({ error: "Game sessions are not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ sessionId: await signSession(env.SESSION_SECRET, Date.now()) }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
