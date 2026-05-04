// Mock in-memory store for dev/testing when KV isn't bound yet
let mockLeaderboard: {name: string, score: number}[] = [];

export const onRequestGet = async (context: any) => {
  const { env } = context;

  try {
    let topScores: {name: string, score: number}[] = [];

    // Prioritize Cloudflare KV if the user has bound it
    if (env.LEADERBOARD_KV) {
      try {
        let textData = await env.LEADERBOARD_KV.get("top_scores", { type: "text" });
        if (textData) {
          if (!textData.trim().startsWith('[')) {
            textData = `[${textData}]`; // Auto-fix missing brackets
          }
          const data = JSON.parse(textData);
          topScores = Array.isArray(data) ? data : [];
        }
      } catch (e) {
        console.error("KV parsing failed on GET, falling back to empty array", e);
        topScores = [];
      }
    } else {
      // Fallback to Edge Memory (resets across worker reloads, but works for local dev)
      topScores = mockLeaderboard;
    }

    return new Response(JSON.stringify(topScores), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch leaderboard" }), { status: 500 });
  }
};

export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { name, score, timestamp, hash } = body;

    if (!name || typeof name !== 'string' || name.length > 20) {
      return new Response(JSON.stringify({ error: "Invalid name" }), { status: 400 });
    }
    if (typeof score !== 'number' || score < 0 || score > 50000) {
      return new Response(JSON.stringify({ error: "Invalid or impossible score" }), { status: 400 });
    }

    // Time window check (2 minutes = 120000 ms)
    const now = Date.now();
    if (!timestamp || Math.abs(now - timestamp) > 120000) {
      return new Response(JSON.stringify({ error: "Request expired or invalid timestamp" }), { status: 403 });
    }

    // Hash signature check (Anti-Cheat)
    const encoder = new TextEncoder();
    const data = encoder.encode(`${name}:${score}:${timestamp}:YEFRIS_SECRET_SALT_V1`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hash !== expectedHash) {
      return new Response(JSON.stringify({ error: "Invalid signature payload" }), { status: 403 });
    }

    const newEntry = { name: name.trim() || 'Anonymous', score };
    let currentLeaderboard: {name: string, score: number}[] = [];

    if (env.LEADERBOARD_KV) {
      try {
        let textData = await env.LEADERBOARD_KV.get("top_scores", { type: "text" });
        if (textData) {
          if (!textData.trim().startsWith('[')) {
            textData = `[${textData}]`; // Auto-fix missing brackets
          }
          const parsedData = JSON.parse(textData);
          currentLeaderboard = Array.isArray(parsedData) ? parsedData : [];
        }
      } catch (e) {
        console.error("KV parsing failed on POST, overwriting with new valid array", e);
        currentLeaderboard = [];
      }
    } else {
      currentLeaderboard = [...mockLeaderboard];
    }

    // Insert or update existing score (keep highest)
    const existingIndex = currentLeaderboard.findIndex(e => e.name.toLowerCase() === newEntry.name.toLowerCase());
    if (existingIndex !== -1) {
      if (newEntry.score > currentLeaderboard[existingIndex].score) {
        currentLeaderboard[existingIndex] = newEntry;
      }
    } else {
      currentLeaderboard.push(newEntry);
    }

    currentLeaderboard.sort((a, b) => b.score - a.score);
    currentLeaderboard = currentLeaderboard.slice(0, 10);

    // Save
    if (env.LEADERBOARD_KV) {
      await env.LEADERBOARD_KV.put("top_scores", JSON.stringify(currentLeaderboard));
    } else {
      mockLeaderboard = currentLeaderboard;
    }

    return new Response(JSON.stringify({ success: true, leaderboard: currentLeaderboard }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to process score" }), { status: 500 });
  }
};
