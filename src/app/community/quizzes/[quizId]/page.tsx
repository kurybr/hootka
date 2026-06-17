"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GoogleSignInCard } from "@/components/GoogleSignInCard";
import { GlobalQuizLeaderboard } from "@/components/GlobalQuizLeaderboard";
import {
  getGlobalQuizAdminDetails,
  grantGlobalQuizExtraAttempts,
} from "@/lib/globalQuizClient";
import type { QuizAnswerReport } from "@/lib/answerReportUtils";
import { QuizAnswerReport as QuizAnswerReportCard } from "@/components/QuizAnswerReport";
import { PlayerRankingReport } from "@/components/PlayerRankingReport";
import { buildGlobalPlayerRankingReport } from "@/lib/playerRankingReportUtils";
import { useAuth } from "@/providers/AuthProvider";
import type {
  GlobalQuiz,
  GlobalQuizAdminUserEntry,
  GlobalQuizLeaderboardEntry,
} from "@/types/quiz";

export default function CommunityQuizDetailPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const { user } = useAuth();
  const isCreator = Boolean(user && !user.isAnonymous);
  const [quiz, setQuiz] = useState<GlobalQuiz | null>(null);
  const [leaderboard, setLeaderboard] = useState<GlobalQuizLeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<GlobalQuizAdminUserEntry[]>([]);
  const [answerReport, setAnswerReport] = useState<QuizAnswerReport | null>(null);
  const [loading, setLoading] = useState(Boolean(isCreator));
  const [error, setError] = useState<string | null>(null);
  const [grantValue, setGrantValue] = useState<Record<string, string>>({});

  const playerRankingReport = useMemo(
    () => buildGlobalPlayerRankingReport(userStats),
    [userStats]
  );

  useEffect(() => {
    if (!isCreator) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getGlobalQuizAdminDetails(quizId);
        if (cancelled) return;
        setQuiz(data.quiz);
        setLeaderboard(data.leaderboard);
        setUserStats(data.userStats);
        setAnswerReport(data.answerReport);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar detalhes");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [quizId, isCreator]);

  const handleGrant = async (targetUserId: string) => {
    const amount = Number(grantValue[targetUserId] || "0");
    const { entry } = await grantGlobalQuizExtraAttempts(quizId, targetUserId, amount);
    setUserStats((current) =>
      current.map((item) => (item.userId === targetUserId ? entry : item))
    );
    setGrantValue((current) => ({ ...current, [targetUserId]: "" }));
  };

  if (!user || !isCreator) {
    return (
      <main className="min-h-screen p-8 lg:p-12">
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <Button variant="outline" asChild>
            <Link href="/community/quizzes">Voltar</Link>
          </Button>
          <GoogleSignInCard
            title="Entre com Google para gerenciar este quiz"
            description="Donos de quiz e administradores precisam de uma conta Google verificada."
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{quiz?.title ?? "Detalhes do quiz"}</h1>
            <p className="text-muted-foreground">
              Gerencie ranking, tentativas extras e publicação do quiz.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/community/quizzes">Voltar</Link>
            </Button>
            {quiz && (
              <Button asChild>
                <Link href={`/community/quizzes/${quiz.id}/edit`}>Editar quiz</Link>
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading || !quiz ? (
          <p className="text-sm text-muted-foreground">Carregando detalhes...</p>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <p className="text-sm text-muted-foreground">
                  Status: <span className="font-medium text-foreground">{quiz.status}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Visibilidade:{" "}
                  <span className="font-medium text-foreground">{quiz.visibility}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Tentativas padrão:{" "}
                  <span className="font-medium text-foreground">
                    {quiz.attemptLimit === null ? "Ilimitadas" : quiz.attemptLimit}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Perguntas:{" "}
                  <span className="font-medium text-foreground">{quiz.questions.length}</span>
                </p>
              </CardContent>
            </Card>

            <GlobalQuizLeaderboard entries={leaderboard} title="Melhores resultados" />

            <PlayerRankingReport
              report={playerRankingReport}
              description="Melhor pontuação de cada jogador que participou deste quiz."
            />

            {answerReport && (
              <QuizAnswerReportCard
                report={answerReport}
                description="Distribuição agregada das tentativas concluídas, sem identificar jogadores."
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle>Gerenciar tentativas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Ninguém iniciou este quiz ainda.
                  </p>
                ) : (
                  userStats.map((entry) => (
                    <div
                      key={entry.userId}
                      className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1.5fr,1fr,1fr,1fr]"
                    >
                      <div>
                        <p className="font-medium">{entry.username}</p>
                        <p className="text-xs text-muted-foreground">{entry.email}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Tentativas usadas: {entry.attemptsUsed}</p>
                        <p>
                          Restantes:{" "}
                          {entry.remainingAttempts === null
                            ? "Ilimitadas"
                            : entry.remainingAttempts}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Extras: {entry.extraAttemptsGranted}</p>
                        <p>Melhor score: {entry.bestScore} pts</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          placeholder="+ tentativas"
                          value={grantValue[entry.userId] ?? ""}
                          onChange={(event) =>
                            setGrantValue((current) => ({
                              ...current,
                              [entry.userId]: event.target.value,
                            }))
                          }
                        />
                        <Button onClick={() => void handleGrant(entry.userId)}>
                          Conceder
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
