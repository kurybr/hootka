"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gerar perguntas com IA</CardTitle>
          <CardDescription>
            Entre com Google para gerar perguntas com IA (OpenRouter).
          </CardDescription>
        </CardHeader>
      </Card>
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
    <Card className="border-primary/20 bg-muted/20">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div>
              <CardTitle className="text-lg">Gerar perguntas com IA</CardTitle>
              <CardDescription>
                Informe um tema e a quantidade. As perguntas geradas são adicionadas ao
                formulário — você pode editar tudo antes de criar a sala.
              </CardDescription>
            </div>
          </div>
          {usage !== null && (
            <span className="text-xs whitespace-nowrap text-muted-foreground">
              Gerações: {usage.used}/{usage.limit}
              {usage.remaining > 0 ? ` (${usage.remaining} restantes)` : ""}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="ai-topic" className="text-sm font-medium">
            Tema
          </label>
          <Input
            id="ai-topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Ex.: astronomia básica"
            disabled={busy || atLimit}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="w-full space-y-1 sm:w-28">
            <label htmlFor="ai-count" className="text-xs text-muted-foreground">
              Qtd. perguntas
            </label>
            <Input
              id="ai-count"
              type="number"
              min={1}
              max={12}
              value={count}
              onChange={(event) => setCount(event.target.value)}
              disabled={busy || atLimit}
            />
          </div>
          <Button
            type="button"
            className="sm:ml-auto"
            onClick={() => void handleGenerate()}
            disabled={busy || atLimit}
          >
            {busy ? "Gerando…" : "Gerar perguntas"}
          </Button>
        </div>
        {atLimit && (
          <p className="text-sm text-amber-700 dark:text-amber-500" role="status">
            Você atingiu o limite de gerações com IA para sua conta.
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
