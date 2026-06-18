"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";

import { LiveRoomForm } from "@/components/LiveRoomForm";
import { QuizCreatePageShell } from "@/components/QuizCreatePageShell";
import { cloneQuestions, createEmptyQuestion } from "@/lib/questionUtils";
import { useRealTime } from "@/providers/RealTimeContext";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { trackEvent } from "@/lib/gtag";
import type { Question, QuizOptionPaletteId } from "@/types/quiz";
import { DEFAULT_QUIZ_OPTION_PALETTE_ID } from "@/types/quiz";

function CreateRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = useRealTime();
  const { saveQuiz: libSaveQuiz, quizzes } = useQuizLibrary();
  const [loading, setLoading] = useState(false);
  const [initialQuestions, setInitialQuestions] = useState<Question[]>([
    createEmptyQuestion(),
  ]);
  const [initialQuizTitle, setInitialQuizTitle] = useState("");
  const [initialOptionPaletteId, setInitialOptionPaletteId] =
    useState<QuizOptionPaletteId>(DEFAULT_QUIZ_OPTION_PALETTE_ID);

  const quizId = searchParams.get("quizId");

  useEffect(() => {
    if (quizId) {
      const quiz = quizzes.find((q) => q.id === quizId);
      if (quiz) {
        setInitialQuestions(
          quiz.questions.length > 0
            ? cloneQuestions(quiz.questions)
            : [createEmptyQuestion()]
        );
        setInitialQuizTitle(quiz.title);
        setInitialOptionPaletteId(
          quiz.optionPaletteId ?? DEFAULT_QUIZ_OPTION_PALETTE_ID
        );
      }
    }
  }, [quizId, quizzes]);

  return (
    <QuizCreatePageShell
      title="Criar Sala"
      description="Monte o quiz da sala ao vivo. Cada pergunta tem até 4 alternativas e uma resposta correta."
      backHref="/host"
    >
      <LiveRoomForm
        key={quizId ?? "new"}
        persistDraft={!quizId}
        initialQuestions={initialQuestions}
        initialQuizTitle={initialQuizTitle}
        initialOptionPaletteId={initialOptionPaletteId}
        submitLabel="Criar Sala"
        loading={loading}
        onSubmit={async (values) => {
          setLoading(true);
          try {
            if (values.saveToLibrary) {
              const title = values.quizTitle || "Quiz sem título";
              await libSaveQuiz({
                title,
                questions: values.questions,
                optionPaletteId: values.optionPaletteId,
              });
              toast({
                title: "Quiz salvo na biblioteca",
                description: `"${title}" foi adicionado.`,
              });
            }

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
            setLoading(false);
          }
        }}
      />
    </QuizCreatePageShell>
  );
}

export default function CreateRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-8">
          Carregando...
        </div>
      }
    >
      <CreateRoomContent />
    </Suspense>
  );
}
