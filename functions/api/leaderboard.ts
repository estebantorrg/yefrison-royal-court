// Mock in-memory store for dev/testing when KV isn't bound yet
let mockLeaderboard: {name: string, score: number}[] = [];

export const onRequestGet = async (context: any) => {
  const { env } = context;

  try {
    let topScores = [];

    // Prioritize Cloudflare KV if the user has bound it
    if (env.LEADERBOARD_KV) {
      const data = await env.LEADERBOARD_KV.get("top_scores", "json");
      topScores = data || [];
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
    const { name, score } = body;

    if (!name || typeof name !== 'string' || name.length > 20) {
      return new Response(JSON.stringify({ error: "Invalid name" }), { status: 400 });
    }
    if (typeof score !== 'number' || score < 0) {
      return new Response(JSON.stringify({ error: "Invalid score" }), { status: 400 });
    }

    const newEntry = { name: name.trim() || 'Anonymous', score };
    let currentLeaderboard: {name: string, score: number}[] = [];

    if (env.LEADERBOARD_KV) {
      const data = await env.LEADERBOARD_KV.get("top_scores", "json");
      currentLeaderboard = data || [];
    } else {
      currentLeaderboard = [...mockLeaderboard];
    }

    // Insert and sort (descending)
    currentLeaderboard.push(newEntry);
    currentLeaderboard.sort((a, b) => b.score - a.score);
    
    // Keep top 10
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
