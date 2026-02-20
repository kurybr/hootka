"use client";

import { Trophy, Medal, Award, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RankedParticipant } from "@/hooks/useRanking";

interface RankingProps {
  participants: RankedParticipant[];
  currentParticipantId?: string | null;
  className?: string;
}

const TOP_COLORS = [
  "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100",
  "border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200",
  "border-amber-700 bg-amber-100/50 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
] as const;

export function Ranking({
  participants,
  currentParticipantId = null,
  className,
}: RankingProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-medium">Ranking</h3>
      <ul className="space-y-2">
        {participants.map((p) => {
          const isTop3 = p.position <= 3;
          const isCurrent = p.id === currentParticipantId;
          const isDisconnected = p.connected === false;
          const topStyle = isTop3 ? TOP_COLORS[p.position - 1] : "";

          return (
            <li
              key={p.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2",
                isTop3 && topStyle,
                isCurrent && !isTop3 && "border-primary bg-primary/10 font-medium",
                isDisconnected && "opacity-60"
              )}
            >
              <span className="flex w-8 shrink-0 items-center justify-center">
                {p.position === 1 && <Trophy className="h-5 w-5 text-amber-500" />}
                {p.position === 2 && <Medal className="h-5 w-5 text-slate-400" />}
                {p.position === 3 && <Award className="h-5 w-5 text-amber-700" />}
                {p.position > 3 && (
                  <span className="text-sm font-medium text-muted-foreground">
                    {p.position}º
                  </span>
                )}
              </span>
              <span className="flex-1 truncate">{p.name}</span>
              <span className="font-mono font-semibold">{p.totalScore} pts</span>
              {isDisconnected && (
                <span
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                  title="Desconectado"
                >
                  <WifiOff className="h-4 w-4" />
                  desconectado
                </span>
              )}
              {isCurrent && !isDisconnected && (
                <span className="text-xs text-muted-foreground">(você)</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
