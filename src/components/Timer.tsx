"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTimer } from "@/hooks/useTimer";
import { useSound } from "@/providers/SoundProvider";
import { cn } from "@/lib/utils";

interface TimerProps {
  questionStartTimestamp: number | null;
  className?: string;
}

export function Timer({
  questionStartTimestamp,
  className,
}: TimerProps) {
  const { timeLeft, isExpired, progress } = useTimer(questionStartTimestamp);
  const { playTick } = useSound();
  const lastTickRef = useRef<number | null>(null);

  const displayText = isExpired ? "Tempo esgotado!" : `${timeLeft}s`;

  const getBarColor = () => {
    if (timeLeft > 30) return "bg-green-500";
    if (timeLeft > 10) return "bg-yellow-500";
    return "bg-red-500";
  };

  const isUrgent = timeLeft > 0 && timeLeft <= 10;
  const isCritical = timeLeft > 0 && timeLeft <= 5;

  useEffect(() => {
    if (!questionStartTimestamp || isExpired || timeLeft > 5) return;
    if (lastTickRef.current !== timeLeft) {
      lastTickRef.current = timeLeft;
      playTick();
    }
  }, [timeLeft, isExpired, questionStartTimestamp, playTick]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Tempo restante</span>
        <motion.span
          className={cn(
            "font-mono text-2xl font-bold",
            isExpired && "text-destructive"
          )}
          animate={
            isCritical
              ? { scale: [1, 1.1, 1], opacity: [1, 0.9, 1] }
              : isUrgent
                ? { scale: 1 }
                : {}
          }
          transition={
            isCritical
              ? { repeat: Infinity, duration: 0.5 }
              : { duration: 0.2 }
          }
        >
          {questionStartTimestamp === null ? "—" : displayText}
        </motion.span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn(
            "h-full transition-colors duration-300",
            getBarColor()
          )}
          style={{ width: `${progress * 100}%` }}
          animate={
            isCritical
              ? {
                  opacity: [1, 0.7, 1],
                  boxShadow: [
                    "0 0 0 0 rgba(239,68,68,0)",
                    "0 0 12px 2px rgba(239,68,68,0.4)",
                    "0 0 0 0 rgba(239,68,68,0)",
                  ],
                }
              : {}
          }
          transition={
            isCritical ? { repeat: Infinity, duration: 0.6 } : { duration: 0.2 }
          }
        />
      </div>
    </div>
  );
}
