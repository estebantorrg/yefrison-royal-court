// Game Session API — Server-side anti-cheat token system
// Flow: Frontend calls POST /api/game-session at game start → gets a sessionId
// At game end, frontend sends sessionId with the score to /api/leaderboard
// Backend validates the session exists, hasn't expired, and hasn't been used

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequestOptions = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const onRequestPost = async (context: any) => {
  const { env } = context;

  try {
    // Generate a cryptographically random session ID and secret
    const sessionIdBytes = new Uint8Array(16);
    const secretBytes = new Uint8Array(32);
    crypto.getRandomValues(sessionIdBytes);
    crypto.getRandomValues(secretBytes);

    const sessionId = Array.from(sessionIdBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const secret = Array.from(secretBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    const sessionData = {
      secret,
      createdAt: Date.now(),
      used: false,
    };

    if (env.LEADERBOARD_KV) {
      // Store with 10-minute TTL
      await env.LEADERBOARD_KV.put(
        `session:${sessionId}`,
        JSON.stringify(sessionData),
        { expirationTtl: 600 }
      );
    }

    return new Response(JSON.stringify({ sessionId }), {
      status: 200,
      headers: CORS_HEADERS,
    });

  } catch (error) {
    console.error("Failed to create game session:", error);
    return new Response(JSON.stringify({ error: "Failed to create session" }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};
