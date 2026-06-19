"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { DonateQuizAiSuccessDialog } from "@/components/DonateQuizAiSuccessDialog";
import {
  generateFullGlobalQuizWithAi,
  getQuizAiGenerationUsage,
  type QuizAiUsage,
} from "@/lib/globalQuizClient";
import {
  recordDonatePromptShown,
  shouldShowDonatePrompt,
} from "@/lib/donatePromptStorage";
import { trackEvent } from "@/lib/gtag";
import { useAuth } from "@/providers/AuthProvider";
import { useDonate } from "@/providers/DonateProvider";
import type { Question } from "@/types/quiz";

export interface GeneratedGlobalQuizDraft {
  title: string;
  topic: string;
  description: string;
  questions: Question[];
}

interface GlobalQuizAiPromptCardProps {
  onApply: (draft: GeneratedGlobalQuizDraft) => void;
  onClearForm: () => void;
}

export function GlobalQuizAiPromptCard({ onApply, onClearForm }: GlobalQuizAiPromptCardProps) {
  const { user } = useAuth();
  const { enabled: donateEnabled, isHostContext, openDonateDialog } = useDonate();
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState("5");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<QuizAiUsage | null>(null);
  const [donateSuccessOpen, setDonateSuccessOpen] = useState(false);
  const donatePromptRecordedRef = useRef(false);

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

  const atLimit = usage !== null && usage.remaining <= 0;

  const recordDonatePromptOnce = useCallback((action: "dismiss" | "opened") => {
    if (donatePromptRecordedRef.current) return;
    donatePromptRecordedRef.current = true;
    recordDonatePromptShown("quiz_ai_generate", action);
  }, []);

  const maybeShowDonatePrompt = useCallback(() => {
    if (
      !donateEnabled ||
      !isHostContext ||
      !shouldShowDonatePrompt("quiz_ai_generate", { isHostContext })
    ) {
      return;
    }

    donatePromptRecordedRef.current = false;
    trackEvent("donate_prompt_shown", { trigger: "quiz_ai_generate" });
    setDonateSuccessOpen(true);
  }, [donateEnabled, isHostContext]);

  const handleDonateSuccessOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        recordDonatePromptOnce("dismiss");
      }
      setDonateSuccessOpen(open);
    },
    [recordDonatePromptOnce]
  );

  const handleDonateSupport = useCallback(() => {
    recordDonatePromptOnce("opened");
    setDonateSuccessOpen(false);
    openDonateDialog({ source: "quiz_ai_generate" });
  }, [openDonateDialog, recordDonatePromptOnce]);

  const handleDonateContinue = useCallback(() => {
    recordDonatePromptOnce("dismiss");
    setDonateSuccessOpen(false);
  }, [recordDonatePromptOnce]);

  if (!user || user.isAnonymous) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gerar quiz com IA</CardTitle>
          <CardDescription>
            Entre com Google para gerar título, descrição e perguntas de uma vez (OpenRouter).
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleGenerate = async () => {
    setError(null);
    const p = prompt.trim();
    if (p.length < 8) {
      setError("Descreva o que você quer com pelo menos 8 caracteres (tema, público, nível…).");
      return;
    }
    const n = Math.min(12, Math.max(1, parseInt(count, 10) || 5));
    setBusy(true);
    try {
      const draft = await generateFullGlobalQuizWithAi({ prompt: p, count: n });
      onApply({
        title: draft.title,
        topic: draft.topic,
        description: draft.description,
        questions: draft.questions.map((q) => ({
          ...q,
          options: [...q.options],
        })),
      });
      if (draft.usage) setUsage(draft.usage);
      else void refreshUsage();
      setError(null);
      maybeShowDonatePrompt();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao gerar.");
    } finally {
      setBusy(false);
    }
  };

  const handleClearForm = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Limpar título, tema, descrição e todas as perguntas? O texto do prompt acima não será apagado."
      )
    ) {
      return;
    }
    onClearForm();
    setError(null);
  };

  return (
    <>
    <Card className="border-primary/20 bg-muted/20">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
            <div>
              <CardTitle className="text-lg">Gerar quiz com IA</CardTitle>
              <CardDescription>
                Descreva o quiz abaixo. A IA preenche título, tema, descrição e perguntas — você pode
                editar tudo antes de publicar. O prompt permanece para você ajustar e gerar de novo.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {usage !== null && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Gerações: {usage.used}/{usage.limit}
                {usage.remaining > 0 ? ` (${usage.remaining} restantes)` : ""}
              </span>
            )}
            <Button type="button" variant="outline" size="sm" onClick={handleClearForm}>
              Limpar formulário
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="global-ai-prompt" className="text-sm font-medium">
            O que você quer neste quiz?
          </label>
          <textarea
            id="global-ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex.: Quiz introdutório de astronomia para adolescentes, 5 perguntas fáceis sobre planetas e constelações."
            disabled={busy}
            rows={4}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y min-h-[100px]"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="w-full sm:w-28 space-y-1">
            <label htmlFor="global-ai-count" className="text-xs text-muted-foreground">
              Qtd. perguntas
            </label>
            <Input
              id="global-ai-count"
              type="number"
              min={1}
              max={12}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              disabled={busy || atLimit}
            />
          </div>
          <Button
            type="button"
            className="sm:ml-auto"
            onClick={() => void handleGenerate()}
            disabled={busy || atLimit}
          >
            {busy ? "Gerando…" : "Gerar quiz completo"}
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
    <DonateQuizAiSuccessDialog
      open={donateSuccessOpen}
      onOpenChange={handleDonateSuccessOpenChange}
      onHowToSupport={handleDonateSupport}
      onContinue={handleDonateContinue}
    />
    </>
  );
}
