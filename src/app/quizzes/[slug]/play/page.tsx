"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlobalQuizPlayerStartCard } from "@/components/GlobalQuizPlayerStartCard";
import { QUIZ_SURFACE_CARD_CLASS } from "@/components/QuizQuestionCardHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { ResultCard } from "@/components/ResultCard";
import { Timer } from "@/components/Timer";
import { usePublicGlobalQuiz } from "@/hooks/usePublicGlobalQuiz";
import {
  finishGlobalQuizAttempt,
  startGlobalQuizAttempt,
  submitGlobalQuizAnswer,
} from "@/lib/globalQuizClient";
import { useAuth } from "@/providers/AuthProvider";
import { isValidPlayerDisplayName } from "@/lib/playerIdentity";
import { trackEvent } from "@/lib/gtag";
import { useTimer } from "@/hooks/useTimer";
import type {
  GlobalQuizAttempt,
  GlobalQuizAttemptAnswer,
  GlobalQuizLeaderboardEntry,
} from "@/types/quiz";

export default function GlobalQuizPlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { user, profile } = useAuth();
  const { quiz, loading, error, setLeaderboard } = usePublicGlobalQuiz(slug);
  const [attempt, setAttempt] = useState<GlobalQuizAttempt | null>(null);
  const [attemptLoading, setAttemptLoading] = useState(false);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{
    question: { text: string; options: string[]; correctOptionIndex: number };
    answer: GlobalQuizAttemptAnswer;
    attempt: GlobalQuizAttempt;
    completed: boolean;
    leaderboard: GlobalQuizLeaderboardEntry[];
  } | null>(null);
  const autoExpiredQuestionRef = useRef<number | null>(null);

  const identityReady =
    Boolean(user) &&
    isValidPlayerDisplayName(profile?.username ?? user?.displayName ?? null);

  useEffect(() => {
    if (!quiz || !identityReady) return;
    let cancelled = false;

    const start = async () => {
      setAttemptLoading(true);
      try {
        const data = await startGlobalQuizAttempt(quiz.id);
        if (cancelled) return;
        setAttempt(data.attempt);
        setAttemptError(null);
        trackEvent("global_quiz_attempt_started", { quiz_id: quiz.id });
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
  }, [quiz, identityReady]);

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
      if (!quiz || !attempt) return;

      setSubmitting(true);
      try {
        const data = await submitGlobalQuizAnswer(quiz.id, optionIndex);
        const answeredQuestion = quiz.questions[data.answer.questionIndex];
        if (!answeredQuestion) {
          setAttempt(data.attempt);
          setLeaderboard(data.leaderboard);
          if (data.completed) router.replace(`/quizzes/${quiz.slug}/ranking`);
          return;
        }
        setLastFeedback({
          question: {
            ...answeredQuestion,
            correctOptionIndex: data.correctOptionIndex,
          },
          answer: data.answer,
          attempt: data.attempt,
          completed: data.completed,
          leaderboard: data.leaderboard,
        });
      } catch (err) {
        setAttemptError(
          err instanceof Error ? err.message : "Não foi possível enviar a resposta."
        );
        setSelectedIndex(null);
      } finally {
        setSubmitting(false);
      }
    },
    [quiz, attempt, setLeaderboard, router]
  );

  const handleContinueFeedback = useCallback(() => {
    if (!lastFeedback) return;
    setAttempt(lastFeedback.attempt);
    setLeaderboard(lastFeedback.leaderboard);
    setLastFeedback(null);
    if (lastFeedback.completed) {
      trackEvent("global_quiz_attempt_completed", { quiz_id: quiz?.id ?? "" });
      router.replace(`/quizzes/${slug}/ranking`);
    }
  }, [lastFeedback, setLeaderboard, router, slug, quiz?.id]);

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
        ) : !quiz ? null : !identityReady ? (
          <GlobalQuizPlayerStartCard submitLabel="Continuar" />
        ) : attemptLoading || !attempt || !currentQuestion ? (
          <p className="text-sm text-muted-foreground">Preparando sua tentativa...</p>
        ) : lastFeedback ? (
          <AnimatePresence mode="wait">
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Card className={QUIZ_SURFACE_CARD_CLASS}>
                <CardHeader>
                  <CardTitle>Resultado da Rodada</CardTitle>
                  <CardDescription>
                    Confira seu desempenho nesta pergunta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ResultCard
                    question={lastFeedback.question}
                    optionPaletteId={quiz.optionPaletteId}
                    selectedIndex={lastFeedback.answer.optionIndex}
                    score={lastFeedback.answer.score}
                    correct={lastFeedback.answer.correct}
                  />
                  <p className="text-center text-sm text-muted-foreground">
                    Pontuação atual: {lastFeedback.attempt.totalScore} pontos
                  </p>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleContinueFeedback}
                  >
                    {lastFeedback.completed
                      ? "Ver ranking final"
                      : "Próxima pergunta"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        ) : (
          <Card className={QUIZ_SURFACE_CARD_CLASS}>
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
                optionPaletteId={quiz.optionPaletteId}
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
