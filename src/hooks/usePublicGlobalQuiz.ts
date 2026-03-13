"use client";

import { useCallback, useEffect, useState } from "react";
import { getPublicGlobalQuizBySlug } from "@/lib/globalQuizClient";
import type { GlobalQuizLeaderboardEntry, PublicGlobalQuiz } from "@/types/quiz";

export function usePublicGlobalQuiz(slug: string) {
  const [quiz, setQuiz] = useState<PublicGlobalQuiz | null>(null);
  const [leaderboard, setLeaderboard] = useState<GlobalQuizLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const data = await getPublicGlobalQuizBySlug(slug);
      setQuiz(data.quiz);
      setLeaderboard(data.leaderboard);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar o quiz");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { quiz, leaderboard, loading, error, refresh, setLeaderboard };
}
