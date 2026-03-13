"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GlobalQuizLeaderboardEntry } from "@/types/quiz";

interface GlobalQuizLeaderboardProps {
  entries: GlobalQuizLeaderboardEntry[];
  currentUserId?: string | null;
  title?: string;
}

export function GlobalQuizLeaderboard({
  entries,
  currentUserId = null,
  title = "Ranking global",
}: GlobalQuizLeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda não há resultados publicados para este quiz.
          </p>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.userId}
              className={cn(
                "flex items-center justify-between rounded-lg border px-4 py-3",
                entry.userId === currentUserId && "border-primary bg-primary/5"
              )}
            >
              <div>
                <p className="font-medium">
                  {index + 1}. {entry.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(entry.totalResponseTime / 1000)}s totais
                </p>
              </div>
              <p className="font-mono text-lg font-bold">{entry.score} pts</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
