"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GlobalQuizAiPromptCard } from "@/components/GlobalQuizAiPromptCard";
import { QuestionListEditor } from "@/components/QuestionListEditor";
import { QUIZ_SURFACE_CARD_CLASS } from "@/components/QuizQuestionCardHeader";
import {
  cloneQuestions,
  createEmptyQuestion,
  DEFAULT_LIVE_ROOM_TIME_LIMIT_MS,
  sanitizeQuestionTimeLimitSeconds,
  trimQuestion,
  validateQuestions,
} from "@/lib/questionUtils";
import type { Question } from "@/types/quiz";

export interface LiveRoomFormValues {
  questions: Question[];
  questionTimeLimitMs: number;
  saveToLibrary: boolean;
  quizTitle: string;
}

interface LiveRoomFormProps {
  initialQuestions?: Question[];
  initialQuizTitle?: string;
  submitLabel: string;
  loading?: boolean;
  onSubmit: (values: LiveRoomFormValues) => Promise<void>;
}

export function LiveRoomForm({
  initialQuestions,
  initialQuizTitle = "",
  submitLabel,
  loading = false,
  onSubmit,
}: LiveRoomFormProps) {
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions?.length
      ? cloneQuestions(initialQuestions)
      : [createEmptyQuestion()]
  );
  const [quizTitle, setQuizTitle] = useState(initialQuizTitle);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [questionTimeLimitSeconds, setQuestionTimeLimitSeconds] = useState(
    String(DEFAULT_LIVE_ROOM_TIME_LIMIT_MS / 1000)
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const questionsError = validateQuestions(questions);
    if (questionsError) {
      setError(questionsError);
      return;
    }

    if (saveToLibrary && !quizTitle.trim()) {
      setError("Informe um título para salvar o quiz na biblioteca.");
      return;
    }

    try {
      await onSubmit({
        questions: questions.map(trimQuestion),
        questionTimeLimitMs: sanitizeQuestionTimeLimitSeconds(questionTimeLimitSeconds),
        saveToLibrary,
        quizTitle: quizTitle.trim(),
      });
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
            setSaveToLibrary(true);
          }
          setError(null);
        }}
        onClearForm={() => {
          setQuestions([createEmptyQuestion()]);
          setQuizTitle("");
          setSaveToLibrary(false);
          setError(null);
        }}
      />

      <Card className={QUIZ_SURFACE_CARD_CLASS}>
        <CardHeader>
          <CardTitle>Dados da sala</CardTitle>
          <CardDescription>
            Configure o tempo por pergunta e, se quiser, salve o quiz na biblioteca para
            reutilizar depois.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="quiz-title" className="text-sm font-medium">
              Título do quiz
            </label>
            <Input
              id="quiz-title"
              placeholder="Ex: Conhecimentos Gerais (opcional)"
              value={quizTitle}
              onChange={(event) => setQuizTitle(event.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
        </CardContent>
      </Card>

      <QuestionListEditor questions={questions} onChange={setQuestions} showAiBar={false} />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button onClick={() => void handleSubmit()} disabled={loading} className="w-full">
        {loading ? "Criando..." : submitLabel}
      </Button>
    </div>
  );
}
