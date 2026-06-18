"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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
import { LiveQuizPageShell } from "@/components/LiveQuizPageShell";
import {
  QUIZ_SURFACE_CARD_CLASS,
  QuizQuestionCardHeader,
} from "@/components/QuizQuestionCardHeader";
import { formatLiveRoomSubtitle, formatRoomCodeLabel } from "@/lib/liveQuizDisplay";
import { useRealTime } from "@/hooks/useRealTime";
import { useRoom } from "@/hooks/useRoom";
import { useParticipants } from "@/hooks/useParticipants";
import { useGameState } from "@/hooks/useGameState";
import { useTimer } from "@/hooks/useTimer";
import { resolveQuestionTimeLimitMs } from "@/lib/questionUtils";
import { useRanking } from "@/hooks/useRanking";
import { Ranking } from "@/components/Ranking";
import { FinalRanking } from "@/components/FinalRanking";
import { PlayerRankingReport } from "@/components/PlayerRankingReport";
import { buildLivePlayerRankingReport } from "@/lib/playerRankingReportUtils";
import { ResultCard } from "@/components/ResultCard";
import { SoundToggle } from "@/components/SoundToggle";
import { fireConfetti } from "@/lib/confetti";
import { trackEvent } from "@/lib/gtag";
import { toast } from "@/hooks/use-toast";
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
  const questionTimeLimitMs = resolveQuestionTimeLimitMs(room?.questionTimeLimitMs);
  const playerRankingReport = useMemo(
    () => buildLivePlayerRankingReport(ranking),
    [ranking]
  );
  const { isExpired } = useTimer(
    status === "playing" ? questionStartTimestamp : null,
    questionTimeLimitMs
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

  const lastAnswerCorrectRef = useRef<boolean | null>(null);
  useEffect(() => {
    const unsub = provider.onAnswerResult((data) => {
      lastAnswerCorrectRef.current = data.correct;
    });
    return unsub;
  }, [provider]);

  const gameFinishedFiredRef = useRef(false);
  useEffect(() => {
    if (status === "finished" && !gameFinishedFiredRef.current) {
      gameFinishedFiredRef.current = true;
      trackEvent("game_finished", { room_id: roomId });
    }
  }, [status, roomId]);

  useEffect(() => {
    if (status === "playing") {
      lastAnswerCorrectRef.current = null;
    }
  }, [status, currentQuestionIndex]);

  useEffect(() => {
    const unsub = provider.onHostDisconnected(() => setHostDisconnected(true));
    return unsub;
  }, [provider]);

  useEffect(() => {
    const unsub = provider.onAccessDenied(() => {
      router.replace("/join");
    });
    return unsub;
  }, [provider, router]);

  useEffect(() => {
    const unsub = provider.onError((err) => {
      if (
        err.code === "RESPOSTA_DUPLICADA" ||
        err.code === "TEMPO_ESGOTADO"
      ) {
        setSelectedIndex(null);
        toast({
          variant: "destructive",
          title:
            err.code === "RESPOSTA_DUPLICADA"
              ? "Você já respondeu"
              : "Tempo esgotado",
          description: err.message,
        });
      }
    });
    return unsub;
  }, [provider]);

  const previousRankingRef = useRef<typeof ranking>([]);

  useEffect(() => {
    if (status === "playing" && ranking.length > 0) {
      previousRankingRef.current = [...ranking];
    }
  }, [status, ranking]);

  const confettiFiredForQuestion = useRef<number>(-1);
  useEffect(() => {
    if (status !== "result" || confettiFiredForQuestion.current === currentQuestionIndex) return;
    let correct = false;
    if (participantId && room && currentQuestion) {
      const qKey = String(currentQuestionIndex);
      const answer = room.answers?.[qKey]?.[participantId];
      if (answer) {
        correct = answer.optionIndex === currentQuestion.correctOptionIndex;
      }
    }
    if (!correct && lastAnswerCorrectRef.current !== true) return;
    correct = correct || lastAnswerCorrectRef.current === true;
    confettiFiredForQuestion.current = currentQuestionIndex;
    const t = setTimeout(() => fireConfetti(), 400);
    return () => clearTimeout(t);
  }, [status, currentQuestionIndex, currentQuestion, participantId, room]);

  const myParticipant = participantId ? room?.participants[participantId] : null;
  const myTotalScore = myParticipant?.totalScore ?? 0;

  if (!roomId) {
    router.replace("/");
    return null;
  }

  return (
    <LiveQuizPageShell
      title={formatRoomCodeLabel(room)}
      description={room ? formatLiveRoomSubtitle(room) : undefined}
      actions={
        <>
          <SoundToggle />
          <Button variant="outline" asChild>
            <Link href="/">Sair</Link>
          </Button>
        </>
      }
    >
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
          <Card className={QUIZ_SURFACE_CARD_CLASS}>
            <CardHeader>
              <CardTitle>Aguardando o host</CardTitle>
              <CardDescription>
                {room ? formatLiveRoomSubtitle(room) : "Preparando a sala..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-sm text-muted-foreground">
                Você está na sala. Assim que o host iniciar, a primeira pergunta
                será exibida.
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
                key={`playing-${currentQuestionIndex}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
          <Card className={QUIZ_SURFACE_CARD_CLASS}>
            <QuizQuestionCardHeader
              questionIndex={currentQuestionIndex}
              questionCount={room?.questions.length ?? 0}
              subtitle={formatLiveRoomSubtitle(room)}
              questionStartTimestamp={questionStartTimestamp}
              timeLimitMs={questionTimeLimitMs}
            />
            <CardContent className="space-y-6">
              <QuestionCard
                question={currentQuestion}
                optionPaletteId={room?.optionPaletteId}
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
              <p className="text-center text-sm text-muted-foreground">
                Pontuação atual: {myTotalScore} pontos
              </p>
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
          <Card className={QUIZ_SURFACE_CARD_CLASS}>
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
                    optionPaletteId={room?.optionPaletteId}
                    selectedIndex={answer?.optionIndex ?? null}
                    score={score}
                    correct={correct}
                  />
                );
              })()}
              <p className="text-center text-sm text-muted-foreground">
                Pontuação atual: {myTotalScore} pontos
              </p>
              {ranking.length > 0 && (() => {
                const myRank = ranking.find((p) => p.id === participantId);
                return (
                  <div className="space-y-2">
                    {myRank && (
                      <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg bg-primary/15 px-4 py-2 text-center font-medium text-primary"
                      >
                        Você ficou em {myRank.position}º lugar!
                      </motion.p>
                    )}
                    <Ranking
                      participants={ranking}
                      currentParticipantId={participantId}
                      previousParticipants={previousRankingRef.current}
                      onCurrentPlayerEnterTop3={() => setTimeout(fireConfetti, 400)}
                    />
                  </div>
                );
              })()}
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
                className="space-y-6"
              >
              <Card className={QUIZ_SURFACE_CARD_CLASS}>
                <CardHeader>
                  <CardTitle>Jogo encerrado</CardTitle>
                  <CardDescription>
                    Confira o ranking final e sua pontuação nesta partida.
                  </CardDescription>
                </CardHeader>
              </Card>
              {ranking.length > 0 && (
                <FinalRanking
                  participants={ranking}
                  currentParticipantId={participantId}
                />
              )}
              <PlayerRankingReport
                report={playerRankingReport}
                currentPlayerId={participantId}
              />
              <Button asChild className="w-full">
                <Link href="/">Voltar ao início</Link>
              </Button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
    </LiveQuizPageShell>
  );
}
