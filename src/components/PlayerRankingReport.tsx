"use client";

import { Award, Medal, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PlayerRankingReport as PlayerRankingReportData } from "@/lib/playerRankingReportUtils";

interface PlayerRankingReportProps {
  report: PlayerRankingReportData;
  title?: string;
  description?: string;
  currentPlayerId?: string | null;
}

function getPositionIcon(position: number) {
  if (position === 1) {
    return <Trophy className="h-4 w-4 text-amber-500" aria-hidden />;
  }
  if (position === 2) {
    return <Medal className="h-4 w-4 text-slate-400" aria-hidden />;
  }
  if (position === 3) {
    return <Award className="h-4 w-4 text-amber-700 dark:text-amber-400" aria-hidden />;
  }
  return null;
}

export function PlayerRankingReport({
  report,
  title = "Ranking completo",
  description,
  currentPlayerId = null,
}: PlayerRankingReportProps) {
  if (report.totalPlayers === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum jogador participou ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : (
          <CardDescription>
            {report.totalPlayers}{" "}
            {report.totalPlayers === 1
              ? report.playersLabel.replace(/s$/, "")
              : report.playersLabel}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="hidden gap-3 border-b px-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[4rem,1fr,6rem]">
          <span>#</span>
          <span>Nome</span>
          <span className="text-right">Pontos</span>
        </div>
        <ul className="space-y-2" role="list">
          {report.entries.map((entry) => {
            const isCurrent = entry.id === currentPlayerId;
            const isTopThree = entry.position <= 3;

            return (
              <li
                key={entry.id}
                className={cn(
                  "grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-lg border px-3 py-2.5 sm:grid-cols-[4rem,1fr,6rem]",
                  isTopThree && "border-primary/20 bg-muted/30",
                  isCurrent && "border-primary bg-primary/10 font-medium"
                )}
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getPositionIcon(entry.position)}
                  <span className="font-mono font-semibold tabular-nums">
                    {entry.position}º
                  </span>
                </div>
                <span className="truncate">{entry.name}</span>
                <div className="text-right">
                  <span className="font-mono text-base font-bold tabular-nums">
                    {entry.score}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">pts</span>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
