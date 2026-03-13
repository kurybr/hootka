"use client";

import { useEffect, useState } from "react";
import { listPublishedGlobalQuizzes } from "@/lib/globalQuizClient";
import type { PublicGlobalQuiz } from "@/types/quiz";

export function useGlobalQuizCatalog() {
  const [quizzes, setQuizzes] = useState<PublicGlobalQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await listPublishedGlobalQuizzes();
        if (cancelled) return;
        setQuizzes(data.quizzes);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar quizzes");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { quizzes, loading, error };
}
