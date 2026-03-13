"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlobalQuizLeaderboard } from "@/components/GlobalQuizLeaderboard";
import { usePublicGlobalQuiz } from "@/hooks/usePublicGlobalQuiz";
import { useAuth } from "@/providers/AuthProvider";

export default function GlobalQuizRankingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user } = useAuth();
  const { quiz, leaderboard, loading, error } = usePublicGlobalQuiz(slug);

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
            <Card>
              <CardHeader>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>
                  Ranking global atualizado com a melhor tentativa de cada usuário.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tema: {quiz.topic || "Sem tema"} · Tentativas:{" "}
                  {quiz.attemptLimit === null ? "Ilimitadas" : quiz.attemptLimit}
                </p>
              </CardContent>
            </Card>

            <GlobalQuizLeaderboard
              entries={leaderboard}
              currentUserId={user?.uid ?? null}
              title="Ranking completo"
            />
          </>
        )}
      </div>
    </main>
  );
}
