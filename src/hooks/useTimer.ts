"use client";

import { useEffect, useState } from "react";

const QUESTION_TIMEOUT_MS = 120000;

interface UseTimerResult {
  timeLeft: number;
  isExpired: boolean;
  progress: number;
}

export function useTimer(
  questionStartTimestamp: number | null
): UseTimerResult {
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMEOUT_MS / 1000);
  const [isExpired, setIsExpired] = useState(false);
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    if (questionStartTimestamp === null) {
      setTimeLeft(QUESTION_TIMEOUT_MS / 1000);
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
        const remainingMs = Math.max(0, QUESTION_TIMEOUT_MS - elapsed);
        const remainingSec = Math.ceil(remainingMs / 1000);
        const progressValue = remainingMs / QUESTION_TIMEOUT_MS;
        setTimeLeft(remainingSec);
        setIsExpired(remainingMs <= 0);
        setProgress(Math.max(0, Math.min(1, progressValue)));
      }
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(rafId);
  }, [questionStartTimestamp]);

  return {
    timeLeft,
    isExpired,
    progress,
  };
}
