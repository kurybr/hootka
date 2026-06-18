"use client";

import { useEffect, useRef, useState } from "react";
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
  cloneQuestions,
  createEmptyQuestion,
  DEFAULT_LIVE_ROOM_TIME_LIMIT_MS,
  sanitizeQuestionTimeLimitSeconds,
  trimQuestion,
  validateQuestions,
} from "@/lib/questionUtils";
import {
  clearQuizFormDraft,
  isLiveRoomFormDraftEmpty,
  LIVE_ROOM_CREATE_DRAFT_KEY,
  loadLiveRoomFormDraft,
  saveLiveRoomFormDraft,
} from "@/lib/quizFormDraftStorage";
import type { Question, QuizOptionPaletteId } from "@/types/quiz";
import { DEFAULT_QUIZ_OPTION_PALETTE_ID } from "@/types/quiz";

export interface LiveRoomFormValues {
  questions: Question[];
  questionTimeLimitMs: number;
  saveToLibrary: boolean;
  quizTitle: string;
  optionPaletteId: QuizOptionPaletteId;
}

interface LiveRoomFormProps {
  initialQuestions?: Question[];
  initialQuizTitle?: string;
  initialOptionPaletteId?: QuizOptionPaletteId;
  initialQuestionTimeLimitSeconds?: string;
  mode?: "create" | "edit";
  persistDraft?: boolean;
  submitLabel: string;
  saveLabel?: string;
  loading?: boolean;
  saving?: boolean;
  onSubmit: (values: LiveRoomFormValues) => Promise<void>;
  onSave?: (values: LiveRoomFormValues) => Promise<void>;
}

export function LiveRoomForm({
  initialQuestions,
  initialQuizTitle = "",
  initialOptionPaletteId = DEFAULT_QUIZ_OPTION_PALETTE_ID,
  initialQuestionTimeLimitSeconds,
  mode = "create",
  persistDraft = true,
  submitLabel,
  saveLabel = "Salvar alterações",
  loading = false,
  saving = false,
  onSubmit,
  onSave,
}: LiveRoomFormProps) {
  const isEditMode = mode === "edit";
  const effectivePersistDraft = persistDraft && !isEditMode;
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions?.length
      ? cloneQuestions(initialQuestions)
      : [createEmptyQuestion()]
  );
  const [quizTitle, setQuizTitle] = useState(initialQuizTitle);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [questionTimeLimitSeconds, setQuestionTimeLimitSeconds] = useState(
    initialQuestionTimeLimitSeconds ??
      String(DEFAULT_LIVE_ROOM_TIME_LIMIT_MS / 1000)
  );
  const [optionPaletteId, setOptionPaletteId] = useState<QuizOptionPaletteId>(
    initialOptionPaletteId
  );
  const [error, setError] = useState<string | null>(null);
  const draftHydratedRef = useRef(false);

  useEffect(() => {
    if (!effectivePersistDraft) {
      draftHydratedRef.current = true;
      return;
    }

    const draft = loadLiveRoomFormDraft(LIVE_ROOM_CREATE_DRAFT_KEY);
    if (draft && !isLiveRoomFormDraftEmpty(draft)) {
      setQuestions(draft.questions);
      setQuizTitle(draft.quizTitle);
      setSaveToLibrary(draft.saveToLibrary);
      setQuestionTimeLimitSeconds(draft.questionTimeLimitSeconds);
      setOptionPaletteId(draft.optionPaletteId);
      toast({
        title: "Rascunho restaurado",
        description: "Continuamos de onde você parou.",
      });
    }

    draftHydratedRef.current = true;
  }, [effectivePersistDraft]);

  useEffect(() => {
    if (effectivePersistDraft) return;

    if (initialQuestions?.length) {
      setQuestions(cloneQuestions(initialQuestions));
    }
    setQuizTitle(initialQuizTitle);
    setOptionPaletteId(initialOptionPaletteId);
    if (initialQuestionTimeLimitSeconds) {
      setQuestionTimeLimitSeconds(initialQuestionTimeLimitSeconds);
    }
  }, [
    effectivePersistDraft,
    initialQuestions,
    initialQuizTitle,
    initialOptionPaletteId,
    initialQuestionTimeLimitSeconds,
  ]);

  useDebouncedEffect(() => {
    if (!effectivePersistDraft || !draftHydratedRef.current) return;

    saveLiveRoomFormDraft(LIVE_ROOM_CREATE_DRAFT_KEY, {
      questions,
      quizTitle,
      saveToLibrary,
      questionTimeLimitSeconds,
      optionPaletteId,
    });
  }, [
    effectivePersistDraft,
    questions,
    quizTitle,
    saveToLibrary,
    questionTimeLimitSeconds,
    optionPaletteId,
  ]);

  const resetForm = () => {
    if (isEditMode) {
      setQuestions(
        initialQuestions?.length
          ? cloneQuestions(initialQuestions)
          : [createEmptyQuestion()]
      );
      setQuizTitle(initialQuizTitle);
      setOptionPaletteId(initialOptionPaletteId);
      setError(null);
      return;
    }

    setQuestions([createEmptyQuestion()]);
    setQuizTitle("");
    setSaveToLibrary(false);
    setQuestionTimeLimitSeconds(String(DEFAULT_LIVE_ROOM_TIME_LIMIT_MS / 1000));
    setOptionPaletteId(DEFAULT_QUIZ_OPTION_PALETTE_ID);
    setError(null);
    if (effectivePersistDraft) {
      clearQuizFormDraft(LIVE_ROOM_CREATE_DRAFT_KEY);
    }
  };

  const buildValues = (): LiveRoomFormValues => ({
    questions: questions.map(trimQuestion),
    questionTimeLimitMs: sanitizeQuestionTimeLimitSeconds(questionTimeLimitSeconds),
    saveToLibrary: isEditMode ? false : saveToLibrary,
    quizTitle: quizTitle.trim(),
    optionPaletteId,
  });

  const validateForm = (): boolean => {
    setError(null);

    const questionsError = validateQuestions(questions);
    if (questionsError) {
      setError(questionsError);
      return false;
    }

    if ((isEditMode || saveToLibrary) && !quizTitle.trim()) {
      setError("Informe um título para o quiz.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!onSave || !validateForm()) return;

    try {
      await onSave(buildValues());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o quiz.");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit(buildValues());
      if (effectivePersistDraft) {
        clearQuizFormDraft(LIVE_ROOM_CREATE_DRAFT_KEY);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a sala.");
    }
  };

  return (
    <div className="space-y-6">
      <GlobalQuizAiPromptCard
        onApply={(draft) => {
          setQuestions(
            draft.questions.length > 0
              ? draft.questions.map((question) => ({
                  ...question,
                  options: [...question.options],
                }))
              : [createEmptyQuestion()]
          );
          if (draft.title.trim()) {
            setQuizTitle(draft.title.trim());
            if (!isEditMode) {
              setSaveToLibrary(true);
            }
          }
          setError(null);
        }}
        onClearForm={resetForm}
      />

      <Card className={QUIZ_SURFACE_CARD_CLASS}>
        <CardHeader>
          <CardTitle>{isEditMode ? "Dados do quiz" : "Dados da sala"}</CardTitle>
          <CardDescription>
            {isEditMode
              ? "Atualize o título, o tempo por pergunta e as cores das alternativas."
              : "Configure o tempo por pergunta e, se quiser, salve o quiz na biblioteca para reutilizar depois."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="quiz-title" className="text-sm font-medium">
              Título do quiz
            </label>
            <Input
              id="quiz-title"
              placeholder={
                isEditMode
                  ? "Ex: Conhecimentos Gerais"
                  : "Ex: Conhecimentos Gerais (opcional)"
              }
              value={quizTitle}
              onChange={(event) => setQuizTitle(event.target.value)}
            />
          </div>

          <div
            className={
              isEditMode ? "space-y-2" : "grid gap-4 md:grid-cols-2"
            }
          >
            <div className="space-y-2">
              <label htmlFor="room-time-limit" className="text-sm font-medium">
                Tempo por pergunta
              </label>
              <Input
                id="room-time-limit"
                type="number"
                min={10}
                value={questionTimeLimitSeconds}
                onChange={(event) => setQuestionTimeLimitSeconds(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Segundos por resposta (mínimo 10)
              </p>
            </div>

            {!isEditMode && (
              <div className="space-y-3">
                <span className="text-sm font-medium">Biblioteca</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={saveToLibrary}
                    onChange={(event) => setSaveToLibrary(event.target.checked)}
                  />
                  <span className="text-sm">
                    Salvar quiz na biblioteca ao criar sala
                  </span>
                </label>
              </div>
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

      {isEditMode && onSave ? (
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => void handleSave()}
            disabled={saving || loading}
            className="flex-1"
          >
            {saving ? "Salvando..." : saveLabel}
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={loading || saving}
            className="flex-1"
          >
            {loading ? "Criando..." : submitLabel}
          </Button>
        </div>
      ) : (
        <Button onClick={() => void handleSubmit()} disabled={loading} className="w-full">
          {loading ? "Criando..." : submitLabel}
        </Button>
      )}
    </div>
  );
}
