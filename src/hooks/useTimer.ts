"use client";

import { useEffect, useState } from "react";
import { DEFAULT_QUESTION_TIME_LIMIT_MS } from "@/lib/questionUtils";

interface UseTimerResult {
  timeLeft: number;
  isExpired: boolean;
  progress: number;
}

export function useTimer(
  questionStartTimestamp: number | null,
  timeLimitMs = DEFAULT_QUESTION_TIME_LIMIT_MS
): UseTimerResult {
  const [timeLeft, setTimeLeft] = useState(timeLimitMs / 1000);
  const [isExpired, setIsExpired] = useState(false);
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    if (questionStartTimestamp === null) {
      setTimeLeft(timeLimitMs / 1000);
      setIsExpired(false);
      setProgress(1);
      return;
    }

    let rafId: number;
    let lastUpdate = performance.now();

    const update = () => {
      const now = performance.now();
      if (now - lastUpdate >= 100) {
        lastUpdate = now;
        const elapsed = Date.now() - questionStartTimestamp;
        const remainingMs = Math.max(0, timeLimitMs - elapsed);
        const remainingSec = Math.ceil(remainingMs / 1000);
        const progressValue = remainingMs / timeLimitMs;
        setTimeLeft(remainingSec);
        setIsExpired(remainingMs <= 0);
        setProgress(Math.max(0, Math.min(1, progressValue)));
      }
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(rafId);
  }, [questionStartTimestamp, timeLimitMs]);

  return {
    timeLeft,
    isExpired,
    progress,
  };
}
