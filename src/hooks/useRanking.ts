"use client";

import { useEffect, useState } from "react";
import { useRealTime } from "./useRealTime";
import type { Participant } from "@/types/quiz";

export interface RankedParticipant extends Participant {
  position: number;
}

export function useRanking(): RankedParticipant[] {
  const provider = useRealTime();
  const [ranking, setRanking] = useState<RankedParticipant[]>([]);

  useEffect(() => {
    const unsub = provider.onRankingUpdate((participants) => {
      setRanking(
        participants.map((p, i) => ({ ...p, position: i + 1 }))
      );
    });
    return unsub;
  }, [provider]);

  return ranking;
}
