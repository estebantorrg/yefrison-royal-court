import { useState, useCallback } from 'react';

export interface LeaderboardEntry {
  name: string;
  score: number;
}

// Leaderboard + anti-cheat session plumbing shared by the ranked games.
export const useLeaderboard = (game: 'defense' | 'burden' | 'flappy') => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/leaderboard?game=${game}`);
      if (res.ok) {
        setLeaderboard(await res.json());
      }
    } catch (e) {
      console.error("Failed to load leaderboard");
    }
  }, [game]);

  // Call at game start: the server signs the start time into the token
  const startSession = async () => {
    setSessionId(null);
    setSubmitted(false);
    setSubmitError('');
    try {
      const res = await fetch('/api/game-session', { method: 'POST' });
      if (res.ok) {
        setSessionId((await res.json()).sessionId);
      }
    } catch (e) {
      console.warn('Failed to get game session, submission may fail');
    }
  };

  const submit = async (name: string, score: number) => {
    if (!name.trim() || isSubmitting) return;
    if (!sessionId) {
      setSubmitError('No game session. Play again to submit.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score, sessionId, game })
      });
      if (res.ok) {
        setSubmitted(true);
        refresh();
      } else {
        const body = await res.json().catch(() => null);
        setSubmitError(body?.error || 'Failed to submit score.');
      }
    } catch (e) {
      console.error('Leaderboard submit exception:', e);
      setSubmitError('Network error. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { leaderboard, refresh, sessionId, startSession, isSubmitting, submitted, submitError, submit };
};
