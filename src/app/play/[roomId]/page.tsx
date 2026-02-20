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
import { useRealTime } from "@/providers/RealTimeContext";
import type { Participant } from "@/types/quiz";

const PARTICIPANT_ID_KEY = "quiz_participantId";

export default function PlayWaitingPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const provider = useRealTime();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantId, setParticipantId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setParticipantId(localStorage.getItem(PARTICIPANT_ID_KEY));
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;

    provider.connect(roomId, "participant");

    const unsubState = provider.onRoomState((room) => {
      setParticipants(
        Object.values(room.participants).sort((a, b) => a.joinedAt - b.joinedAt)
      );
    });

    const unsubParticipant = provider.onParticipantJoined((participant) => {
      setParticipants((prev) => {
        const exists = prev.some((p) => p.id === participant.id);
        if (exists) return prev;
        return [...prev, participant].sort((a, b) => a.joinedAt - b.joinedAt);
      });
    });

    return () => {
      unsubState();
      unsubParticipant();
    };
  }, [roomId, provider]);

  if (!roomId) {
    router.replace("/");
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mx-auto max-w-lg space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Aguardando o jogo</h1>
          <Button variant="outline" asChild>
            <Link href="/">Sair</Link>
          </Button>
        </div>

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
      </div>
    </main>
  );
}
