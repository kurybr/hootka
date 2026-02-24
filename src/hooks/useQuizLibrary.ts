"use client";

import { useEffect, useState, useCallback } from "react";
import type { SavedQuiz } from "@/types/quiz";
import { useAuth } from "@/providers/AuthProvider";
import * as local from "@/lib/quizStorage";
import * as cloud from "@/lib/quizStorageCloud";

export function useQuizLibrary() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshLocal = useCallback(() => {
    setQuizzes(local.getQuizzes());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (uid) {
      setLoading(true);
      const unsubscribe = cloud.subscribeToQuizzes(uid, (data) => {
        setQuizzes(data);
        setLoading(false);
      });
      return unsubscribe;
    }

    refreshLocal();
  }, [uid, refreshLocal]);

  const saveQuiz = useCallback(
    async (quiz: Omit<SavedQuiz, "id" | "createdAt" | "updatedAt">) => {
      if (uid) {
        return cloud.saveQuizCloud(uid, quiz);
      }
      const saved = local.saveQuiz(quiz);
      refreshLocal();
      return saved;
    },
    [uid, refreshLocal]
  );

  const updateQuiz = useCallback(
    async (
      quizId: string,
      updates: Partial<Pick<SavedQuiz, "title" | "questions">>
    ) => {
      if (uid) {
        return cloud.updateQuizCloud(uid, quizId, updates);
      }
      const updated = local.updateQuiz(quizId, updates);
      refreshLocal();
      return updated;
    },
    [uid, refreshLocal]
  );

  const deleteQuiz = useCallback(
    async (quizId: string) => {
      if (uid) {
        return cloud.deleteQuizCloud(uid, quizId);
      }
      local.deleteQuiz(quizId);
      refreshLocal();
    },
    [uid, refreshLocal]
  );

  const duplicateQuiz = useCallback(
    async (quizId: string) => {
      if (uid) {
        return cloud.duplicateQuizCloud(uid, quizId);
      }
      const dup = local.duplicateQuiz(quizId);
      refreshLocal();
      return dup;
    },
    [uid, refreshLocal]
  );

  const refresh = useCallback(async () => {
    if (uid) {
      setLoading(true);
      const data = await cloud.getQuizzesCloud(uid);
      setQuizzes(data);
      setLoading(false);
    } else {
      refreshLocal();
    }
  }, [uid, refreshLocal]);

  return {
    quizzes,
    loading,
    saveQuiz,
    updateQuiz,
    deleteQuiz,
    duplicateQuiz,
    refresh,
  };
}
