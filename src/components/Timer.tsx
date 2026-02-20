"use client";

import { useTimer } from "@/hooks/useTimer";
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
  const displayText = isExpired ? "Tempo esgotado!" : `${timeLeft}s`;

  const getBarColor = () => {
    if (timeLeft > 30) return "bg-green-500";
    if (timeLeft > 10) return "bg-yellow-500";
    return "bg-red-500";
  };

  const isBlinking = timeLeft > 0 && timeLeft <= 5;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Tempo restante</span>
        <span
          className={cn(
            "font-mono text-2xl font-bold",
            isBlinking && "animate-pulse",
            isExpired && "text-destructive"
          )}
        >
          {questionStartTimestamp === null ? "—" : displayText}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all duration-100",
            getBarColor(),
            isBlinking && "animate-pulse"
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
