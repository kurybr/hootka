"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailLinkSignInCard } from "@/components/EmailLinkSignInCard";
import { QuestionCard } from "@/components/QuestionCard";
import { Timer } from "@/components/Timer";
import { usePublicGlobalQuiz } from "@/hooks/usePublicGlobalQuiz";
import {
  finishGlobalQuizAttempt,
  startGlobalQuizAttempt,
  submitGlobalQuizAnswer,
} from "@/lib/globalQuizClient";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "@/hooks/use-toast";
import { useTimer } from "@/hooks/useTimer";
import type { GlobalQuizAttempt } from "@/types/quiz";

export default function GlobalQuizPlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { quiz, loading, error, setLeaderboard } = usePublicGlobalQuiz(slug);
  const [attempt, setAttempt] = useState<GlobalQuizAttempt | null>(null);
  const [attemptLoading, setAttemptLoading] = useState(false);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const autoExpiredQuestionRef = useRef<number | null>(null);

  useEffect(() => {
    if (!quiz || !user) return;
    let cancelled = false;

    const start = async () => {
      setAttemptLoading(true);
      try {
        const data = await startGlobalQuizAttempt(quiz.id);
        if (cancelled) return;
        setAttempt(data.attempt);
        setAttemptError(null);
      } catch (err) {
        if (cancelled) return;
        setAttemptError(
          err instanceof Error ? err.message : "Não foi possível iniciar a tentativa."
        );
      } finally {
        if (!cancelled) {
          setAttemptLoading(false);
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
    };
  }, [quiz, user]);

  useEffect(() => {
    setSelectedIndex(null);
    autoExpiredQuestionRef.current = null;
  }, [attempt?.currentQuestionIndex]);

  const currentQuestion =
    quiz && attempt ? quiz.questions[attempt.currentQuestionIndex] : null;
  const { isExpired } = useTimer(
    attempt?.questionStartTimestamp ?? null,
    quiz?.questionTimeLimitMs
  );

  const handleSubmit = useCallback(
    async (optionIndex: number | null) => {
      if (!quiz) return;

      setSubmitting(true);
      try {
        const data = await submitGlobalQuizAnswer(quiz.id, optionIndex);
        setAttempt(data.attempt);
        setLeaderboard(data.leaderboard);
        if (data.completed) {
          toast({
            title: "Tentativa concluída",
            description: `Sua pontuação final foi ${data.attempt.totalScore} pontos.`,
          });
          router.replace(`/quizzes/${quiz.slug}/ranking`);
        } else {
          toast({
            title: data.answer.correct ? "Resposta correta" : "Resposta registrada",
            description: data.answer.correct
              ? `+${data.answer.score} pontos`
              : "A próxima pergunta já está disponível.",
          });
        }
      } catch (err) {
        setAttemptError(
          err instanceof Error ? err.message : "Não foi possível enviar a resposta."
        );
        setSelectedIndex(null);
      } finally {
        setSubmitting(false);
      }
    },
    [quiz, router, setLeaderboard]
  );

  useEffect(() => {
    if (!isExpired || !attempt || !currentQuestion || submitting) return;
    if (autoExpiredQuestionRef.current === attempt.currentQuestionIndex) return;
    if (selectedIndex !== null) return;

    autoExpiredQuestionRef.current = attempt.currentQuestionIndex;
    void handleSubmit(null);
  }, [attempt, currentQuestion, isExpired, selectedIndex, submitting, handleSubmit]);

  const handleFinish = async () => {
    if (!quiz) return;
    try {
      await finishGlobalQuizAttempt(quiz.id);
      router.replace(`/quizzes/${quiz.slug}`);
    } catch (err) {
      setAttemptError(
        err instanceof Error ? err.message : "Não foi possível encerrar a tentativa."
      );
    }
  };

  return (
    <main className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href={`/quizzes/${slug}`}>Voltar</Link>
          </Button>
          {attempt && (
            <Button variant="ghost" onClick={handleFinish}>
              Encerrar tentativa
            </Button>
          )}
        </div>

        {(error || attemptError) && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {attemptError || error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando quiz...</p>
        ) : !quiz ? null : !user ? (
          <EmailLinkSignInCard
            redirectPath={`/quizzes/${quiz.slug}/play`}
            title="Entre para jogar"
            description="Use seu e-mail para validar sua participação no ranking global."
          />
        ) : attemptLoading || !attempt || !currentQuestion ? (
          <p className="text-sm text-muted-foreground">Preparando sua tentativa...</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                Pergunta {attempt.currentQuestionIndex + 1} de {quiz.questions.length}
              </CardTitle>
              <CardDescription>{quiz.title}</CardDescription>
              <Timer
                questionStartTimestamp={attempt.questionStartTimestamp}
                timeLimitMs={quiz.questionTimeLimitMs}
                size="large"
              />
            </CardHeader>
            <CardContent className="space-y-6">
              <QuestionCard
                question={currentQuestion}
                onAnswer={(index) => {
                  setSelectedIndex(index);
                  void handleSubmit(index);
                }}
                disabled={submitting || selectedIndex !== null}
                selectedIndex={selectedIndex}
                awaitingResult={submitting}
              />
              <p className="text-center text-sm text-muted-foreground">
                Pontuação atual: {attempt.totalScore} pontos
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
