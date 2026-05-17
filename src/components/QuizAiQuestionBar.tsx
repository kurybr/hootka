"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  generateQuizQuestionsWithAi,
  getQuizAiGenerationUsage,
  type QuizAiUsage,
} from "@/lib/globalQuizClient";
import { useAuth } from "@/providers/AuthProvider";
import type { Question } from "@/types/quiz";

interface QuizAiQuestionBarProps {
  onAddQuestions: (questions: Question[]) => void;
}

export function QuizAiQuestionBar({ onAddQuestions }: QuizAiQuestionBarProps) {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState("5");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<QuizAiUsage | null>(null);

  const refreshUsage = useCallback(async () => {
    if (!user || user.isAnonymous) {
      setUsage(null);
      return;
    }
    try {
      setUsage(await getQuizAiGenerationUsage());
    } catch {
      setUsage(null);
    }
  }, [user]);

  useEffect(() => {
    void refreshUsage();
  }, [refreshUsage]);

  if (!user || user.isAnonymous) {
    return (
      <p className="text-xs text-muted-foreground">
        Entre com Google para gerar perguntas com IA (OpenRouter).
      </p>
    );
  }

  const atLimit = usage !== null && usage.remaining <= 0;

  const handleGenerate = async () => {
    setError(null);
    const t = topic.trim();
    if (t.length < 3) {
      setError("Digite um tema com pelo menos 3 caracteres.");
      return;
    }
    const n = Math.min(12, Math.max(1, parseInt(count, 10) || 5));
    setBusy(true);
    try {
      const { questions, usage: nextUsage } = await generateQuizQuestionsWithAi({
        topic: t,
        count: n,
      });
      onAddQuestions(questions);
      if (nextUsage) setUsage(nextUsage);
      else void refreshUsage();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao gerar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-dashed bg-muted/25 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          Gerar perguntas com IA (OpenRouter)
        </span>
        {usage !== null && (
          <span className="text-xs font-normal text-muted-foreground">
            {usage.used}/{usage.limit} gerações
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label htmlFor="ai-topic" className="text-xs text-muted-foreground">
            Tema
          </label>
          <Input
            id="ai-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex.: astronomia básica"
            disabled={busy || atLimit}
          />
        </div>
        <div className="w-24 space-y-1">
          <label htmlFor="ai-count" className="text-xs text-muted-foreground">
            Qtd.
          </label>
          <Input
            id="ai-count"
            type="number"
            min={1}
            max={12}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            disabled={busy || atLimit}
          />
        </div>
        <Button type="button" onClick={() => void handleGenerate()} disabled={busy || atLimit}>
          {busy ? "Gerando..." : "Gerar"}
        </Button>
      </div>
      {atLimit && (
        <p className="text-xs text-amber-700 dark:text-amber-500">
          Limite de gerações com IA atingido para sua conta.
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
