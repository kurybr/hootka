"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdSense } from "@/components/AdSense";
import { GlobalQuizPlayerStartCard } from "@/components/GlobalQuizPlayerStartCard";
import { GlobalQuizLeaderboard } from "@/components/GlobalQuizLeaderboard";
import { usePublicGlobalQuiz } from "@/hooks/usePublicGlobalQuiz";
import { startGlobalQuizAttempt } from "@/lib/globalQuizClient";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "@/hooks/use-toast";
import { isValidPlayerDisplayName } from "@/lib/playerIdentity";

export default function GlobalQuizDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const slugHolder = use(params);
  const { quiz, leaderboard, loading, error } = usePublicGlobalQuiz(slugHolder.slug);

  const canStartFromSession =
    Boolean(user) &&
    isValidPlayerDisplayName(profile?.username ?? user?.displayName ?? null);

  const handleStart = async () => {
    if (!quiz) return;
    try {
      await startGlobalQuizAttempt(quiz.id);
      router.push(`/quizzes/${quiz.slug}/play`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Não foi possível iniciar",
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    }
  };

  return (
    <main className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href="/quizzes">Voltar</Link>
          </Button>
          {quiz && (
            <Button variant="secondary" asChild>
              <Link href={`/quizzes/${quiz.slug}/ranking`}>Ver ranking completo</Link>
            </Button>
          )}
        </div>

        {loading && <p className="text-sm text-muted-foreground">Carregando desafio...</p>}
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
                  {quiz.topic || "Sem tema"} · {quiz.questions.length} pergunta
                  {quiz.questions.length !== 1 ? "s" : ""} ·{" "}
                  {quiz.questionTimeLimitMs / 1000}s por pergunta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {quiz.description || "Sem descrição disponível."}
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                    {quiz.visibility === "official" ? "Desafio oficial" : "Desafio comunitário"}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1">
                    Tentativas: {quiz.attemptLimit === null ? "Ilimitadas" : quiz.attemptLimit}
                  </span>
                </div>
                {canStartFromSession ? (
                  <Button onClick={handleStart} className="w-full">
                    Iniciar tentativa
                  </Button>
                ) : (
                  <GlobalQuizPlayerStartCard
                    submitLabel="Iniciar tentativa"
                    onReadyToPlay={handleStart}
                  />
                )}
              </CardContent>
            </Card>

            <GlobalQuizLeaderboard
              entries={leaderboard.slice(0, 10)}
              currentUserId={user?.uid ?? null}
            />

            <AdSense
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE}
              format="rectangle"
              className="mt-4"
            />
          </>
        )}
      </div>
    </main>
  );
}
