"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

import { LiveRoomForm } from "@/components/LiveRoomForm";
import { QuizCreatePageShell } from "@/components/QuizCreatePageShell";
import { cloneQuestions, createEmptyQuestion } from "@/lib/questionUtils";
import { useRealTime } from "@/providers/RealTimeContext";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { trackEvent } from "@/lib/gtag";
import type { Question, QuizOptionPaletteId } from "@/types/quiz";
import { DEFAULT_QUIZ_OPTION_PALETTE_ID } from "@/types/quiz";

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const provider = useRealTime();
  const { quizzes, loading: quizzesLoading, updateQuiz: libUpdateQuiz } = useQuizLibrary();
  const [initialQuestions, setInitialQuestions] = useState<Question[]>([
    createEmptyQuestion(),
  ]);
  const [initialQuizTitle, setInitialQuizTitle] = useState("");
  const [initialOptionPaletteId, setInitialOptionPaletteId] =
    useState<QuizOptionPaletteId>(DEFAULT_QUIZ_OPTION_PALETTE_ID);
  const [initialQuestionTimeLimitSeconds, setInitialQuestionTimeLimitSeconds] =
    useState<string | undefined>(undefined);
  const [startingRoom, setStartingRoom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (quizzesLoading || initialized) return;

    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) {
      if (quizzes.length > 0) router.replace("/host");
      return;
    }

    setInitialQuizTitle(quiz.title);
    setInitialQuestions(
      quiz.questions.length > 0
        ? cloneQuestions(quiz.questions)
        : [createEmptyQuestion()]
    );
    setInitialOptionPaletteId(quiz.optionPaletteId ?? DEFAULT_QUIZ_OPTION_PALETTE_ID);
    if (typeof quiz.questionTimeLimitMs === "number") {
      setInitialQuestionTimeLimitSeconds(
        String(Math.round(quiz.questionTimeLimitMs / 1000))
      );
    }
    setInitialized(true);
  }, [quizId, quizzes, quizzesLoading, router, initialized]);

  return (
    <QuizCreatePageShell
      title="Editar Quiz"
      description="Edite o quiz da biblioteca. Cada pergunta tem até 4 alternativas e uma resposta correta."
      backHref="/host"
    >
      {!initialized ? (
        <p className="text-sm text-muted-foreground">Carregando quiz...</p>
      ) : (
        <LiveRoomForm
          key={quizId}
          mode="edit"
          persistDraft={false}
          initialQuestions={initialQuestions}
          initialQuizTitle={initialQuizTitle}
          initialOptionPaletteId={initialOptionPaletteId}
          initialQuestionTimeLimitSeconds={initialQuestionTimeLimitSeconds}
          submitLabel="Iniciar Sala com este Quiz"
          saveLabel="Salvar Alterações"
          loading={startingRoom}
          saving={saving}
          onSave={async (values) => {
            setSaving(true);
            try {
              await libUpdateQuiz(quizId, {
                title: values.quizTitle,
                questions: values.questions,
                optionPaletteId: values.optionPaletteId,
                questionTimeLimitMs: values.questionTimeLimitMs,
              });
              setInitialQuizTitle(values.quizTitle);
              setInitialQuestions(cloneQuestions(values.questions));
              setInitialOptionPaletteId(values.optionPaletteId);
              if (typeof values.questionTimeLimitMs === "number") {
                setInitialQuestionTimeLimitSeconds(
                  String(Math.round(values.questionTimeLimitMs / 1000))
                );
              }
              toast({
                title: "Alterações salvas",
                description: "O quiz foi atualizado na biblioteca.",
              });
            } catch {
              toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível salvar as alterações.",
              });
              throw new Error("Não foi possível salvar as alterações.");
            } finally {
              setSaving(false);
            }
          }}
          onSubmit={async (values) => {
            setStartingRoom(true);
            try {
              const { roomId } = await provider.createRoom(
                values.questions,
                values.questionTimeLimitMs,
                values.optionPaletteId
              );
              trackEvent("room_created", { room_id: roomId });
              toast({
                title: "Sala criada!",
                description: "Redirecionando...",
              });
              router.push(`/host/${roomId}`);
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Erro ao criar sala";
              toast({
                variant: "destructive",
                title: "Erro ao criar sala",
                description: msg,
              });
              throw e;
            } finally {
              setStartingRoom(false);
            }
          }}
        />
      )}
    </QuizCreatePageShell>
  );
}
