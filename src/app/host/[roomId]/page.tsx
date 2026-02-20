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
import type { Room } from "@/types/quiz";

export default function HostLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const provider = useRealTime();

  const [room, setRoom] = useState<Room | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    provider.connect(roomId, "host");

    const unsubState = provider.onRoomState((r) => {
      setRoom(r);
    });

    const unsubParticipant = provider.onParticipantJoined((participant) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: {
            ...prev.participants,
            [participant.id]: participant,
          },
        };
      });
    });

    return () => {
      unsubState();
      unsubParticipant();
    };
  }, [roomId, provider]);

  const copyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const participants = room
    ? Object.values(room.participants).sort((a, b) => a.joinedAt - b.joinedAt)
    : [];

  if (!roomId) {
    router.replace("/");
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mx-auto max-w-lg space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Lobby</h1>
          <Button variant="outline" asChild>
            <Link href="/">Sair</Link>
          </Button>
        </div>

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

        <Button size="lg" className="w-full" disabled>
          Iniciar Jogo
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          (Será habilitado no Prompt 7)
        </p>
      </div>
    </main>
  );
}
