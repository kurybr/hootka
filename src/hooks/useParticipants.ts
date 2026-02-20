"use client";

import { useMemo } from "react";
import type { Participant } from "@/types/quiz";
import type { Room } from "@/types/quiz";

export function useParticipants(room: Room | null): Participant[] {
  return useMemo(() => {
    if (!room) return [];
    return Object.values(room.participants).sort(
      (a, b) => a.joinedAt - b.joinedAt
    );
  }, [room]);
}
