"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
import { Timer } from "@/components/Timer";

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

  const copyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGame = () => {
    provider.startGame();
  };

  const handleNextQuestion = () => {
    provider.nextQuestion();
  };

  const handleForceResult = () => {
    provider.forceResult();
  };

  const handleEndGame = () => {
    provider.endGame();
  };

  const currentQuestion = room?.questions[currentQuestionIndex];
  const isLastQuestion =
    room &&
    currentQuestionIndex >= room.questions.length - 1;

  if (!roomId) {
    router.replace("/");
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mx-auto max-w-lg space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sala do Host</h1>
          <Button variant="outline" asChild>
            <Link href="/">Sair</Link>
          </Button>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-center text-muted-foreground">Carregando...</p>
        ) : status === "waiting" ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Código da Sala</CardTitle>
                <CardDescription>
                  Compartilhe este código para os participantes entrarem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 py-8">
                    <span className="font-mono text-4xl font-bold tracking-[0.5em]">
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
              <CardHeader>
                <CardTitle>Participantes ({participants.length})</CardTitle>
                <CardDescription>
                  Aguardando participantes entrarem na sala
                </CardDescription>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    Nenhum participante ainda. Compartilhe o código da sala!
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {participants.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-2 rounded-md border px-3 py-2"
                      >
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        {p.name}
                      </li>
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
          </>
        ) : status === "playing" ? (
          <Card>
            <CardHeader>
              <CardTitle>Pergunta {currentQuestionIndex + 1}</CardTitle>
              <CardDescription>
                {currentQuestion?.text ?? "Carregando..."}
              </CardDescription>
              <Timer
                questionStartTimestamp={questionStartTimestamp}
                className="mt-4"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center font-medium">
                {count} de {total} responderam
              </p>
              <Button variant="outline" onClick={handleForceResult}>
                Encerrar Pergunta
              </Button>
            </CardContent>
          </Card>
        ) : status === "result" ? (
          <Card>
            <CardHeader>
              <CardTitle>Resultado da Rodada</CardTitle>
              <CardDescription>
                Resposta correta e ranking serão exibidos no Prompt 11
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
        ) : status === "finished" ? (
          <Card>
            <CardHeader>
              <CardTitle>Jogo Encerrado</CardTitle>
              <CardDescription>
                Ranking final será exibido no Prompt 11
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/">Voltar ao Início</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
