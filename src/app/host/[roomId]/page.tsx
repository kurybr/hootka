"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRealTime } from "@/hooks/useRealTime";
import { useRoom } from "@/hooks/useRoom";
import { useParticipants } from "@/hooks/useParticipants";
import { useGameState } from "@/hooks/useGameState";
import { useAnswerCount } from "@/hooks/useAnswerCount";
import { useRanking } from "@/hooks/useRanking";
import { Timer } from "@/components/Timer";
import { Ranking } from "@/components/Ranking";
import { FinalRanking } from "@/components/FinalRanking";
import { AnswerDistribution } from "@/components/AnswerDistribution";
import { SoundToggle } from "@/components/SoundToggle";
import { fireConfettiLight } from "@/lib/confetti";
import { trackEvent } from "@/lib/gtag";
import { toast } from "@/hooks/use-toast";

export default function HostRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const provider = useRealTime();
  const [copied, setCopied] = useState(false);

  const { room, loading, error } = useRoom({ roomId, role: "host" });
  const participants = useParticipants(room);
  const {
    status,
    currentQuestionIndex,
    questionStartTimestamp,
  } = useGameState(room);
  const { count, total } = useAnswerCount();
  const ranking = useRanking();

  const copyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Código copiado!",
        description: "Compartilhe com os participantes.",
      });
    }
  };

  const handleStartGame = () => {
    trackEvent("game_started", { room_id: roomId });
    provider.startGame();
  };

  const handleNextQuestion = () => {
    provider.nextQuestion();
  };

  const handleForceResult = () => {
    provider.forceResult();
  };

  const handleEndGame = () => {
    trackEvent("game_finished", { room_id: roomId });
    provider.endGame();
  };

  const currentQuestion = room?.questions[currentQuestionIndex];
  const isLastQuestion =
    room &&
    currentQuestionIndex >= room.questions.length - 1;

  const lastResultFiredFor = useRef<number>(-1);
  useEffect(() => {
    if (status === "result" && lastResultFiredFor.current !== currentQuestionIndex) {
      lastResultFiredFor.current = currentQuestionIndex;
      const t = setTimeout(() => fireConfettiLight(), 300);
      return () => clearTimeout(t);
    }
  }, [status, currentQuestionIndex]);

  if (!roomId) {
    router.replace("/");
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 lg:p-12">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">Sala do Host</h1>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <Button variant="outline" asChild>
              <Link href="/">Sair</Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-center text-muted-foreground">Carregando...</p>
        ) : (
          <AnimatePresence mode="wait">
            {status === "waiting" && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-8"
              >
            <Card>
              <CardHeader className="p-6 lg:p-8">
                <CardTitle>Código da Sala</CardTitle>
                <CardDescription>
                  Compartilhe este código para os participantes entrarem
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 lg:p-8 lg:pt-0">
                <div className="flex items-center gap-4">
                  <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-primary/50 bg-primary/10 py-10 lg:py-12">
                    <span className="font-mono text-5xl font-bold tracking-[0.4em] lg:text-6xl lg:tracking-[0.5em]">
                      {room?.code ?? "---"}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={copyCode}
                    disabled={!room?.code}
                  >
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-6 lg:p-8">
                <CardTitle className="flex items-center gap-2">
                  Participantes
                  <motion.span
                    key={participants.length}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="inline-flex min-w-[2ch] justify-center rounded-full bg-primary/20 px-2 py-0.5 font-mono text-lg font-bold"
                  >
                    {participants.length}
                  </motion.span>
                </CardTitle>
                <CardDescription>
                  Aguardando participantes entrarem na sala
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 lg:p-8 lg:pt-0">
                {participants.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    Nenhum participante ainda. Compartilhe o código da sala!
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {participants.map((p) => (
                      <motion.li
                        key={p.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className={cn(
                          "flex items-center gap-2 rounded-md border px-3 py-2",
                          p.connected === false && "opacity-60"
                        )}
                      >
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            p.connected === false
                              ? "bg-muted-foreground/50"
                              : "bg-green-500"
                          )}
                        />
                        {p.name}
                        {p.connected === false && (
                          <span className="text-xs text-muted-foreground">
                            (desconectado)
                          </span>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="w-full"
              onClick={handleStartGame}
              disabled={participants.length < 1}
            >
              Iniciar Jogo
            </Button>
              </motion.div>
            )}
            {status === "playing" && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
          <Card>
            <CardHeader className="p-6 lg:p-8">
              <CardTitle className="text-xl lg:text-2xl">Pergunta {currentQuestionIndex + 1}</CardTitle>
              <CardDescription className="text-base">
                {currentQuestion?.text ?? "Carregando..."}
              </CardDescription>
              <Timer
                questionStartTimestamp={questionStartTimestamp}
                className="mt-4"
                size="large"
              />
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0 lg:p-8 lg:pt-0">
              <div className="space-y-2">
                <p className="text-center text-xl font-bold lg:text-2xl">
                  {count} de {total} responderam
                </p>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              </div>
              <Button variant="outline" onClick={handleForceResult}>
                Encerrar Pergunta
              </Button>
            </CardContent>
          </Card>
              </motion.div>
            )}
            {status === "result" && currentQuestion && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
          <Card>
            <CardHeader className="p-6 lg:p-8">
              <CardTitle>Resultado da Rodada</CardTitle>
              <CardDescription>
                Resposta correta e distribuição de respostas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 lg:p-8 lg:pt-0">
              {(() => {
                const qKey = String(currentQuestionIndex);
                const answers = room?.answers?.[qKey] ?? {};
                const counts: [number, number, number, number] = [0, 0, 0, 0];
                for (const answer of Object.values(answers)) {
                  if (answer.optionIndex >= 0 && answer.optionIndex <= 3) {
                    counts[answer.optionIndex]++;
                  }
                }
                const total = Object.keys(answers).length;
                return (
                  <AnswerDistribution
                    question={currentQuestion}
                    counts={counts}
                    total={total}
                  />
                );
              })()}
              {ranking.length > 0 && (
                <Ranking participants={ranking} size="large" />
              )}
              {isLastQuestion ? (
                <Button size="lg" className="w-full" onClick={handleEndGame}>
                  Ver Ranking Final
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleNextQuestion}
                >
                  Próxima Pergunta
                </Button>
              )}
            </CardContent>
          </Card>
              </motion.div>
            )}
            {status === "finished" && (
              <motion.div
                key="finished"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
          <Card>
            <CardHeader className="p-6 lg:p-8">
              <CardTitle>Jogo Encerrado</CardTitle>
              <CardDescription>
                Parabéns aos participantes!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 lg:p-8 lg:pt-0">
              {ranking.length > 0 && (
                <FinalRanking participants={ranking} />
              )}
              <Button asChild className="w-full">
                <Link href="/">Voltar ao Início</Link>
              </Button>
            </CardContent>
          </Card>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}
