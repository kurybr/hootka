"use client";

import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RankedParticipant } from "@/hooks/useRanking";

interface FinalRankingProps {
  participants: RankedParticipant[];
  currentParticipantId?: string | null;
  className?: string;
}

export function FinalRanking({
  participants,
  currentParticipantId = null,
  className,
}: FinalRankingProps) {
  const top3 = participants.slice(0, 3);
  const rest = participants.slice(3);

  return (
    <div className={cn("space-y-6", className)}>
      <h2 className="text-center text-2xl font-bold">Ranking Final</h2>

      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-4">
          {top3[1] && (
            <div className="flex flex-col items-center">
              <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800">
                <Medal className="h-8 w-8 text-slate-400" />
              </div>
              <div className="rounded-lg border-2 border-slate-300 bg-slate-50 px-6 py-4 dark:border-slate-600 dark:bg-slate-800">
                <p className="text-center font-bold">2º</p>
                <p className="text-center font-medium">{top3[1].name}</p>
                <p className="text-center font-mono text-lg font-bold text-slate-600 dark:text-slate-300">
                  {top3[1].totalScore} pts
                </p>
              </div>
            </div>
          )}
          {top3[0] && (
            <div className="flex flex-col items-center">
              <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/50">
                <Trophy className="h-10 w-10 text-amber-500" />
              </div>
              <div className="rounded-lg border-2 border-amber-400 bg-amber-50 px-8 py-5 dark:border-amber-500 dark:bg-amber-950/50">
                <p className="text-center font-bold text-amber-700 dark:text-amber-400">
                  🏆 1º Vencedor
                </p>
                <p className="text-center text-lg font-bold">{top3[0].name}</p>
                <p className="text-center font-mono text-xl font-bold text-amber-700 dark:text-amber-400">
                  {top3[0].totalScore} pts
                </p>
              </div>
            </div>
          )}
          {top3[2] && (
            <div className="flex flex-col items-center">
              <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-700 bg-amber-100/50 dark:border-amber-500 dark:bg-amber-900/50">
                <Award className="h-6 w-6 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="rounded-lg border-2 border-amber-700 bg-amber-100/50 px-5 py-3 dark:border-amber-500 dark:bg-amber-900/50">
                <p className="text-center font-bold">3º</p>
                <p className="text-center font-medium">{top3[2].name}</p>
                <p className="text-center font-mono font-bold text-amber-800 dark:text-amber-300">
                  {top3[2].totalScore} pts
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {rest.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Demais participantes
          </h3>
          <ul className="space-y-2">
            {rest.map((p) => {
              const isCurrent = p.id === currentParticipantId;
              return (
                <li
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2",
                    isCurrent && "border-primary bg-primary/10 font-medium"
                  )}
                >
                  <span className="w-12 text-sm text-muted-foreground">
                    {p.position}º
                  </span>
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="font-mono font-semibold">{p.totalScore} pts</span>
                  {isCurrent && (
                    <span className="text-xs text-muted-foreground">(você)</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
