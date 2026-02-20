"use client";

import { useMemo } from "react";
import type { Room } from "@/types/quiz";

interface UseGameStateResult {
  status: Room["status"];
  currentQuestionIndex: number;
  questionStartTimestamp: number | null;
}

export function useGameState(room: Room | null): UseGameStateResult {
  return useMemo(() => {
    if (!room) {
      return {
        status: "waiting",
        currentQuestionIndex: 0,
        questionStartTimestamp: null,
      };
    }
    return {
      status: room.status,
      currentQuestionIndex: room.currentQuestionIndex,
      questionStartTimestamp: room.questionStartTimestamp,
    };
  }, [room]);
}
