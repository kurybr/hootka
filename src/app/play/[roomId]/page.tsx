"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QuestionCard } from "@/components/QuestionCard";
import { Timer } from "@/components/Timer";
import { useRealTime } from "@/hooks/useRealTime";
import { useRoom } from "@/hooks/useRoom";
import { useParticipants } from "@/hooks/useParticipants";
import { useGameState } from "@/hooks/useGameState";
import { useTimer } from "@/hooks/useTimer";
import { useRanking } from "@/hooks/useRanking";
import { Ranking } from "@/components/Ranking";
import { FinalRanking } from "@/components/FinalRanking";
import { ResultCard } from "@/components/ResultCard";
import { SoundToggle } from "@/components/SoundToggle";

const PARTICIPANT_ID_KEY = "quiz_participantId";

export default function PlayRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const provider = useRealTime();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hostDisconnected, setHostDisconnected] = useState(false);

  const { room, loading, error } = useRoom({ roomId, role: "participant" });
  const ranking = useRanking();
  const participants = useParticipants(room);
  const {
    status,
    currentQuestionIndex,
    questionStartTimestamp,
  } = useGameState(room);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setParticipantId(localStorage.getItem(PARTICIPANT_ID_KEY));
    }
  }, []);

  const currentQuestion = room?.questions[currentQuestionIndex];
  const { isExpired } = useTimer(
    status === "playing" ? questionStartTimestamp : null
  );

  const handleAnswer = (optionIndex: number) => {
    setSelectedIndex(optionIndex);
    provider.submitAnswer(optionIndex);
  };

  useEffect(() => {
    if (status === "playing") {
      setSelectedIndex(null);
    }
  }, [status, currentQuestionIndex]);

  useEffect(() => {
    const unsub = provider.onHostDisconnected(() => setHostDisconnected(true));
    return unsub;
  }, [provider]);

  useEffect(() => {
    const unsub = provider.onError((err) => {
      if (
        err.code === "RESPOSTA_DUPLICADA" ||
        err.code === "TEMPO_ESGOTADO"
      ) {
        setSelectedIndex(null);
      }
    });
    return unsub;
  }, [provider]);

  if (!roomId) {
    router.replace("/");
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mx-auto max-w-lg space-y-8">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">Quiz</h1>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <Button variant="outline" asChild>
              <Link href="/">Sair</Link>
            </Button>
          </div>
        </div>

        {hostDisconnected && (
          <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
            O host está temporariamente desconectado. A sala permanece ativa.
            Aguarde a reconexão.
          </div>
        )}

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
              >
          <Card>
            <CardHeader>
              <CardTitle>Aguardando o Host iniciar o jogo...</CardTitle>
              <CardDescription>
                Assim que o host iniciar, a primeira pergunta será exibida
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-center text-muted-foreground">
                Você está na sala. Aguarde o host clicar em &quot;Iniciar
                Jogo&quot;.
              </p>

              <div>
                <h3 className="mb-3 text-sm font-medium">
                  Participantes na sala ({participants.length})
                </h3>
                {participants.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Carregando...
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {participants.map((p) => (
                      <li
                        key={p.id}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
                          p.id === participantId
                            ? "border-primary bg-primary/10 font-medium"
                            : ""
                        } ${p.connected === false ? "opacity-60" : ""}`}
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            p.connected === false
                              ? "bg-muted-foreground/50"
                              : "bg-green-500"
                          }`}
                        />
                        {p.name}
                        {p.connected === false && (
                          <span className="text-xs text-muted-foreground">
                            (desconectado)
                          </span>
                        )}
                        {p.id === participantId && p.connected !== false && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            (você)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
              </motion.div>
            )}
            {status === "playing" && currentQuestion && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
          <Card>
            <CardHeader>
              <CardTitle>Pergunta {currentQuestionIndex + 1}</CardTitle>
              <Timer questionStartTimestamp={questionStartTimestamp} />
            </CardHeader>
            <CardContent className="space-y-6">
              <QuestionCard
                question={currentQuestion}
                onAnswer={handleAnswer}
                disabled={isExpired || selectedIndex !== null}
                selectedIndex={selectedIndex}
                awaitingResult={selectedIndex !== null}
              />
              {isExpired && (
                <p className="text-center font-medium text-destructive">
                  Tempo esgotado!
                </p>
              )}
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
            <CardHeader>
              <CardTitle>Resultado da Rodada</CardTitle>
              <CardDescription>
                Confira seu desempenho nesta pergunta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(() => {
                const qKey = String(currentQuestionIndex);
                const answer = participantId
                  ? room?.answers?.[qKey]?.[participantId]
                  : null;
                const correct = answer
                  ? answer.optionIndex === currentQuestion.correctOptionIndex
                  : false;
                const score = answer?.score ?? 0;
                return (
                  <ResultCard
                    question={currentQuestion}
                    selectedIndex={answer?.optionIndex ?? null}
                    score={score}
                    correct={correct}
                  />
                );
              })()}
              {ranking.length > 0 && (
                <Ranking
                  participants={ranking}
                  currentParticipantId={participantId}
                />
              )}
              <p className="text-center text-muted-foreground">
                Aguardando próxima pergunta...
              </p>
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
            <CardHeader>
              <CardTitle>Jogo Encerrado</CardTitle>
              <CardDescription>
                Parabéns aos participantes!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {ranking.length > 0 && (
                <FinalRanking
                  participants={ranking}
                  currentParticipantId={participantId}
                />
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
