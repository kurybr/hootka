"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OptionPalettePicker } from "@/components/OptionPalettePicker";
import { GlobalQuizAiPromptCard } from "@/components/GlobalQuizAiPromptCard";
import { QuestionListEditor } from "@/components/QuestionListEditor";
import { QUIZ_SURFACE_CARD_CLASS } from "@/components/QuizQuestionCardHeader";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";
import { toast } from "@/hooks/use-toast";
import {
  DEFAULT_QUESTION_OPTIONS,
  DEFAULT_QUESTION_TIME_LIMIT_MS,
  createEmptyQuestion,
  trimQuestion,
  validateQuestions,
} from "@/lib/questionUtils";
import {
  clearQuizFormDraft,
  GLOBAL_QUIZ_CREATE_DRAFT_KEY,
  isGlobalQuizFormDraftEmpty,
  loadGlobalQuizFormDraft,
  saveGlobalQuizFormDraft,
} from "@/lib/quizFormDraftStorage";
import type { GlobalQuiz, Question, QuizOptionPaletteId } from "@/types/quiz";
import { DEFAULT_QUIZ_OPTION_PALETTE_ID } from "@/types/quiz";

interface GlobalQuizFormValues {
  title: string;
  description: string;
  topic: string;
  visibility: GlobalQuiz["visibility"];
  status: GlobalQuiz["status"];
  attemptLimit: number | null;
  questionTimeLimitMs: number;
  optionPaletteId: QuizOptionPaletteId;
  questions: Question[];
}

interface GlobalQuizFormProps {
  initialValues?: Partial<GlobalQuizFormValues>;
  persistDraft?: boolean;
  submitLabel: string;
  loading?: boolean;
  isAdmin?: boolean;
  onSubmit: (values: GlobalQuizFormValues) => Promise<void>;
}

export function GlobalQuizForm({
  initialValues,
  persistDraft = !initialValues,
  submitLabel,
  loading = false,
  isAdmin = false,
  onSubmit,
}: GlobalQuizFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [topic, setTopic] = useState(initialValues?.topic ?? "");
  const [visibility, setVisibility] = useState<GlobalQuiz["visibility"]>(
    initialValues?.visibility ?? "community"
  );
  const [status, setStatus] = useState<GlobalQuiz["status"]>(
    initialValues?.status ?? "draft"
  );
  const [attemptLimitMode, setAttemptLimitMode] = useState<"limited" | "unlimited">(
    initialValues?.attemptLimit === null ? "unlimited" : "limited"
  );
  const [attemptLimitInput, setAttemptLimitInput] = useState(
    initialValues?.attemptLimit?.toString() ?? "3"
  );
  const [questionTimeLimitSeconds, setQuestionTimeLimitSeconds] = useState(
    String(
      Math.round(
        (initialValues?.questionTimeLimitMs ?? DEFAULT_QUESTION_TIME_LIMIT_MS) / 1000
      )
    )
  );
  const [questions, setQuestions] = useState<Question[]>(
    initialValues?.questions?.length
      ? initialValues.questions.map((question) => ({
          ...question,
          options: [...question.options],
        }))
      : [createEmptyQuestion(DEFAULT_QUESTION_OPTIONS)]
  );
  const [optionPaletteId, setOptionPaletteId] = useState<QuizOptionPaletteId>(
    initialValues?.optionPaletteId ?? DEFAULT_QUIZ_OPTION_PALETTE_ID
  );
  const [error, setError] = useState<string | null>(null);
  const draftHydratedRef = useRef(false);

  useEffect(() => {
    if (!persistDraft) {
      draftHydratedRef.current = true;
      return;
    }

    const draft = loadGlobalQuizFormDraft(GLOBAL_QUIZ_CREATE_DRAFT_KEY);
    if (draft && !isGlobalQuizFormDraftEmpty(draft)) {
      setTitle(draft.title);
      setDescription(draft.description);
      setTopic(draft.topic);
      setVisibility(draft.visibility);
      setStatus(draft.status);
      setAttemptLimitMode(draft.attemptLimitMode);
      setAttemptLimitInput(draft.attemptLimitInput);
      setQuestionTimeLimitSeconds(draft.questionTimeLimitSeconds);
      setOptionPaletteId(draft.optionPaletteId);
      setQuestions(draft.questions);
      toast({
        title: "Rascunho restaurado",
        description: "Continuamos de onde você parou.",
      });
    }

    draftHydratedRef.current = true;
  }, [persistDraft]);

  useDebouncedEffect(() => {
    if (!persistDraft || !draftHydratedRef.current) return;

    saveGlobalQuizFormDraft(GLOBAL_QUIZ_CREATE_DRAFT_KEY, {
      title,
      description,
      topic,
      visibility,
      status,
      attemptLimitMode,
      attemptLimitInput,
      questionTimeLimitSeconds,
      optionPaletteId,
      questions,
    });
  }, [
    persistDraft,
    title,
    description,
    topic,
    visibility,
    status,
    attemptLimitMode,
    attemptLimitInput,
    questionTimeLimitSeconds,
    optionPaletteId,
    questions,
  ]);

  const resetForm = () => {
    setTitle("");
    setTopic("");
    setDescription("");
    setVisibility("community");
    setStatus("draft");
    setAttemptLimitMode("limited");
    setAttemptLimitInput("3");
    setQuestionTimeLimitSeconds(
      String(Math.round(DEFAULT_QUESTION_TIME_LIMIT_MS / 1000))
    );
    setOptionPaletteId(DEFAULT_QUIZ_OPTION_PALETTE_ID);
    setQuestions([createEmptyQuestion(DEFAULT_QUESTION_OPTIONS)]);
    setError(null);
    if (persistDraft) {
      clearQuizFormDraft(GLOBAL_QUIZ_CREATE_DRAFT_KEY);
    }
  };

  const attemptLimit = useMemo(() => {
    if (attemptLimitMode === "unlimited") return null;
    const parsed = Number(attemptLimitInput);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
  }, [attemptLimitInput, attemptLimitMode]);

  const handleSubmit = async () => {
    setError(null);

    if (!title.trim()) {
      setError("Informe um título para o desafio.");
      return;
    }

    const questionsError = validateQuestions(questions);
    if (questionsError) {
      setError(questionsError);
      return;
    }

    if (attemptLimitMode === "limited" && attemptLimit === null) {
      setError("Informe um limite de tentativas válido.");
      return;
    }

    const questionTimeLimitMs = Math.max(
      10000,
      Number(questionTimeLimitSeconds || "120") * 1000
    );

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        topic: topic.trim(),
        visibility: isAdmin ? visibility : "community",
        status,
        attemptLimit,
        questionTimeLimitMs,
        optionPaletteId,
        questions: questions.map(trimQuestion),
      });
      if (persistDraft) {
        clearQuizFormDraft(GLOBAL_QUIZ_CREATE_DRAFT_KEY);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o desafio.");
    }
  };

  return (
    <div className="space-y-6">
      <GlobalQuizAiPromptCard
        onApply={(draft) => {
          setTitle(draft.title);
          setTopic(draft.topic);
          setDescription(draft.description);
          setQuestions(draft.questions);
          setError(null);
        }}
        onClearForm={resetForm}
      />

      <Card className={QUIZ_SURFACE_CARD_CLASS}>
        <CardHeader>
          <CardTitle>Dados do desafio</CardTitle>
          <CardDescription>
            Configure como o desafio aparecerá para o público e como o ranking será
            controlado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título</label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tema</label>
            <Input
              value={topic}
              placeholder="Ex: Módulo 05"
              onChange={(event) => setTopic(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <textarea
              value={description}
              placeholder="Explique o objetivo do desafio."
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[110px] w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as GlobalQuiz["status"])
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tempo por pergunta</label>
              <Input
                type="number"
                min={10}
                value={questionTimeLimitSeconds}
                onChange={(event) => setQuestionTimeLimitSeconds(event.target.value)}
              />
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Visibilidade</label>
              <select
                value={visibility}
                onChange={(event) =>
                  setVisibility(event.target.value as GlobalQuiz["visibility"])
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="community">Comunitário</option>
                <option value="official">Oficial</option>
              </select>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium">Limite de tentativas</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={attemptLimitMode === "limited"}
                  onChange={() => setAttemptLimitMode("limited")}
                />
                Limitado
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={attemptLimitMode === "unlimited"}
                  onChange={() => setAttemptLimitMode("unlimited")}
                />
                Ilimitado
              </label>
            </div>
            {attemptLimitMode === "limited" && (
              <Input
                type="number"
                min={1}
                value={attemptLimitInput}
                onChange={(event) => setAttemptLimitInput(event.target.value)}
              />
            )}
          </div>

          <OptionPalettePicker value={optionPaletteId} onChange={setOptionPaletteId} />
        </CardContent>
      </Card>

      <QuestionListEditor questions={questions} onChange={setQuestions} showAiBar={false} />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {loading ? "Salvando..." : submitLabel}
      </Button>
    </div>
  );
}
