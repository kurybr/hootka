"use client";

import { useEffect, useState } from "react";
import { useRealTime } from "./useRealTime";
import type { Room } from "@/types/quiz";

interface UseRoomOptions {
  roomId: string;
  role: "host" | "participant";
}

interface UseRoomResult {
  room: Room | null;
  loading: boolean;
  error: string | null;
}

export function useRoom({ roomId, role }: UseRoomOptions): UseRoomResult {
  const provider = useRealTime();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    provider.connect(roomId, role);

    const unsubState = provider.onRoomState((r) => {
      setRoom(r);
      setLoading(false);
    });

    const unsubParticipant = provider.onParticipantJoined((participant) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: {
            ...(prev.participants ?? {}),
            [participant.id]: participant,
          },
        };
      });
    });

    const unsubGameStatus = provider.onGameStatusChanged((data) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: data.status,
          currentQuestionIndex: data.questionIndex,
          questionStartTimestamp: data.timestamp,
        };
      });
    });

    const unsubError = provider.onError((err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => {
      unsubState();
      unsubParticipant();
      unsubGameStatus();
      unsubError();
    };
  }, [roomId, role, provider]);

  return { room, loading, error };
}
