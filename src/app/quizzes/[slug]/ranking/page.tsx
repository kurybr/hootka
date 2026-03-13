"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlobalQuizLeaderboard } from "@/components/GlobalQuizLeaderboard";
import { usePublicGlobalQuiz } from "@/hooks/usePublicGlobalQuiz";
import { useAuth } from "@/providers/AuthProvider";
import { fireConfetti } from "@/lib/confetti";

const STORAGE_KEY = "hootka_ranking_prev_pos";

export default function GlobalQuizRankingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user } = useAuth();
  const { quiz, leaderboard, loading, error, refresh } = usePublicGlobalQuiz(slug);
  const [previousPosition, setPreviousPosition] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `${STORAGE_KEY}_${slug}`;
    const stored = sessionStorage.getItem(key);
    if (stored) {
      const pos = parseInt(stored, 10);
      if (!isNaN(pos)) setPreviousPosition(pos);
      sessionStorage.removeItem(key);
    }
  }, [slug]);

  useEffect(() => {
    if (!quiz) return;
    const interval = setInterval(() => refresh(true), 20000);
    return () => clearInterval(interval);
  }, [quiz, refresh]);

  const handlePositionChange = (prevPos: number, newPos: number) => {
    if (newPos <= 3 && prevPos > 3) {
      setTimeout(fireConfetti, 400);
    }
  };

  const userPosition = user?.uid ? leaderboard.findIndex((e) => e.userId === user.uid) + 1 : 0;
  const handleJogarNovamente = () => {
    if (userPosition > 0) {
      sessionStorage.setItem(`${STORAGE_KEY}_${slug}`, String(userPosition));
    }
  };

  return (
    <main className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href={`/quizzes/${slug}`}>Voltar ao quiz</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/quizzes">Catálogo</Link>
          </Button>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Carregando ranking...</p>}
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {quiz && (
          <>
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>
                  Ranking global atualizado com a melhor tentativa de cada jogador.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tema: {quiz.topic || "Sem tema"} · Tentativas permitidas:{" "}
                  {quiz.attemptLimit === null ? "Ilimitadas" : quiz.attemptLimit}
                </p>
              </CardContent>
            </Card>

            {user?.uid && (() => {
              const userPosition = leaderboard.findIndex((e) => e.userId === user.uid) + 1;
              if (userPosition > 0) {
                return (
                  <p
                    className="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-center font-medium text-primary"
                    role="status"
                  >
                    Sua posição no ranking: #{userPosition}
                  </p>
                );
              }
              return null;
            })()}

            <GlobalQuizLeaderboard
              entries={leaderboard}
              currentUserId={user?.uid ?? null}
              title="Demais posições"
              previousPosition={previousPosition}
              onPositionChange={handlePositionChange}
            />

            <div className="flex flex-col items-center gap-4 pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href={`/quizzes/${slug}/play`} onClick={handleJogarNovamente}>
                  Jogar novamente
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
