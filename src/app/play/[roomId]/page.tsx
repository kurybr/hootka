"use client";

import { useEffect, useState } from "react";
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
import { useRoom } from "@/hooks/useRoom";
import { useParticipants } from "@/hooks/useParticipants";
import { useGameState } from "@/hooks/useGameState";

const PARTICIPANT_ID_KEY = "quiz_participantId";

export default function PlayRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const [participantId, setParticipantId] = useState<string | null>(null);

  const { room, loading, error } = useRoom({ roomId, role: "participant" });
  const participants = useParticipants(room);
  const { status, currentQuestionIndex } = useGameState(room);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setParticipantId(localStorage.getItem(PARTICIPANT_ID_KEY));
    }
  }, []);

  const currentQuestion = room?.questions[currentQuestionIndex];

  if (!roomId) {
    router.replace("/");
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mx-auto max-w-lg space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Quiz</h1>
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
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        {p.name}
                        {p.id === participantId && (
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
        ) : status === "playing" ? (
          <Card>
            <CardHeader>
              <CardTitle>Pergunta {currentQuestionIndex + 1}</CardTitle>
              <CardDescription>
                {currentQuestion?.text ?? "Carregando..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Alternativas e timer serão exibidos no Prompt 8
              </p>
            </CardContent>
          </Card>
        ) : status === "result" ? (
          <Card>
            <CardHeader>
              <CardTitle>Resultado da Rodada</CardTitle>
              <CardDescription>
                Seu resultado e ranking serão exibidos no Prompt 11
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                Aguardando próxima pergunta...
              </p>
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
