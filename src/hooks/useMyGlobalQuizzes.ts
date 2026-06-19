"use client";

import { useCallback, useEffect, useState } from "react";
import { listMyGlobalQuizzes } from "@/lib/globalQuizClient";
import type { PublicGlobalQuiz } from "@/types/quiz";

export function useMyGlobalQuizzes(enabled: boolean) {
  const [quizzes, setQuizzes] = useState<PublicGlobalQuiz[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setQuizzes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await listMyGlobalQuizzes();
      setQuizzes(data.quizzes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar seus desafios");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { quizzes, loading, error, refresh };
}
