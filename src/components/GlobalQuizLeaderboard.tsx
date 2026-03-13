"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GlobalQuizLeaderboardEntry } from "@/types/quiz";

interface GlobalQuizLeaderboardProps {
  entries: GlobalQuizLeaderboardEntry[];
  currentUserId?: string | null;
  title?: string;
  /** Optional: previous position from sessionStorage (e.g. when returning from play) */
  previousPosition?: number | null;
  /** Callback when position change is detected (for confetti when entering top 3) */
  onPositionChange?: (prevPos: number, newPos: number) => void;
}

const PODIUM_STYLES = [
  "border-yellow-200 bg-yellow-50 dark:bg-amber-950/50 dark:border-amber-500/40",
  "border-slate-300 bg-slate-100 dark:bg-slate-800/50 dark:border-slate-500/40",
  "border-orange-200 bg-orange-50 dark:bg-orange-950/50 dark:border-orange-500/40",
] as const;

function getPositionIcon(position: number) {
  if (position === 1) return <Trophy className="h-6 w-6 text-amber-500 dark:text-amber-400" aria-hidden />;
  if (position === 2) return <Medal className="h-6 w-6 text-slate-500 dark:text-slate-400" aria-hidden />;
  if (position === 3) return <Award className="h-6 w-6 text-orange-600 dark:text-orange-400" aria-hidden />;
  return (
    <span className="text-sm font-semibold text-muted-foreground tabular-nums">
      #{position}
    </span>
  );
}

function ScoreDisplay({ score }: { score: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-2xl font-bold tabular-nums sm:text-3xl">{score}</span>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">pts</span>
    </div>
  );
}

function PodiumCard({
  entry,
  position,
  isCurrentUser,
  isFirstPlace,
  isScoreHighlight,
}: {
  entry: GlobalQuizLeaderboardEntry;
  position: number;
  isCurrentUser: boolean;
  isFirstPlace: boolean;
  isScoreHighlight?: boolean;
}) {
  const Icon = position === 1 ? Trophy : position === 2 ? Medal : Award;
  const label = position === 1 ? "1º lugar" : position === 2 ? "2º lugar" : "3º lugar";

  return (
    <motion.div layout transition={{ type: "spring", stiffness: 400, damping: 30 }}>
      <Card
        className={cn(
          "flex flex-col items-center rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md",
          PODIUM_STYLES[position - 1],
          isFirstPlace && "scale-105 sm:scale-110",
          isCurrentUser && "border-primary ring-2 ring-primary/20",
          isScoreHighlight && "bg-primary/10"
        )}
      >
      <CardHeader className="pb-2 pt-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Icon className="h-6 w-6 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center gap-1 pb-6 pt-0">
        <p
          className={cn(
            "text-center font-semibold truncate max-w-full px-2",
            isCurrentUser && "text-primary"
          )}
        >
          {entry.username}
          {isCurrentUser && (
            <span className="ml-1 text-xs font-normal text-muted-foreground">(você)</span>
          )}
        </p>
        <ScoreDisplay score={entry.score} />
      </CardContent>
    </Card>
    </motion.div>
  );
}

function RankingRow({
  entry,
  position,
  isCurrentUser,
  isScoreHighlight,
}: {
  entry: GlobalQuizLeaderboardEntry;
  position: number;
  isCurrentUser: boolean;
  isScoreHighlight?: boolean;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors duration-300 hover:bg-muted/50",
        isCurrentUser && "border-primary bg-primary/10",
        isScoreHighlight && "bg-primary/10"
      )}
    >
      <div className="flex w-12 shrink-0 items-center justify-center">
        {getPositionIcon(position)}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium truncate", isCurrentUser && "text-primary")}>
          {entry.username}
          {isCurrentUser && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">(você)</span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="font-mono text-2xl font-bold tabular-nums sm:text-3xl">{entry.score}</span>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">pts</span>
      </div>
    </motion.li>
  );
}

function getPosition(entries: GlobalQuizLeaderboardEntry[], userId: string): number {
  const idx = entries.findIndex((e) => e.userId === userId);
  return idx >= 0 ? idx + 1 : 0;
}

export function GlobalQuizLeaderboard({
  entries,
  currentUserId = null,
  title = "Ranking global",
  previousPosition = null,
  onPositionChange,
}: GlobalQuizLeaderboardProps) {
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  const prevEntriesRef = useRef<GlobalQuizLeaderboardEntry[]>([]);
  const [positionFeedback, setPositionFeedback] = useState<{
    type: "up" | "down";
    position: number;
  } | null>(null);
  const [highlightedUserIds, setHighlightedUserIds] = useState<Set<string>>(new Set());

  const hasHandledPrevPosRef = useRef(false);

  useEffect(() => {
    if (entries.length === 0) return;

    const prevEntries = prevEntriesRef.current;
    const newPos = currentUserId ? getPosition(entries, currentUserId) : 0;

    if (previousPosition != null && previousPosition > 0 && newPos > 0 && previousPosition !== newPos && !hasHandledPrevPosRef.current) {
      hasHandledPrevPosRef.current = true;
      setPositionFeedback(newPos < previousPosition ? { type: "up", position: newPos } : { type: "down", position: newPos });
      onPositionChange?.(previousPosition, newPos);
      const t = setTimeout(() => setPositionFeedback(null), 4000);
      prevEntriesRef.current = [...entries];
      return () => clearTimeout(t);
    }

    if (prevEntries.length > 0) {
      const oldPos = currentUserId ? getPosition(prevEntries, currentUserId) : 0;
      if (oldPos > 0 && newPos > 0 && oldPos !== newPos) {
        setPositionFeedback(newPos < oldPos ? { type: "up", position: newPos } : { type: "down", position: newPos });
        onPositionChange?.(oldPos, newPos);
        const t = setTimeout(() => setPositionFeedback(null), 4000);
      }
      const scoreChangedUserIds = new Set<string>();
      for (const e of entries) {
        const prev = prevEntries.find((p) => p.userId === e.userId);
        if (prev && prev.score !== e.score) scoreChangedUserIds.add(e.userId);
      }
      if (scoreChangedUserIds.size > 0) {
        setHighlightedUserIds(scoreChangedUserIds);
        const t = setTimeout(() => setHighlightedUserIds(new Set()), 800);
      }
    }

    prevEntriesRef.current = [...entries];
  }, [entries, currentUserId, previousPosition, onPositionChange]);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {positionFeedback && (
          <motion.p
            key="feedback"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-center font-medium",
              positionFeedback.type === "up"
                ? "border-green-500/50 bg-green-50 text-green-800 dark:bg-green-950/50 dark:text-green-200"
                : "border-amber-500/50 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
            )}
            role="status"
          >
            {positionFeedback.type === "up" ? (
              <>
                <ArrowUp className="h-4 w-4 shrink-0" aria-hidden />
                Você subiu para a posição #{positionFeedback.position}!
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4 shrink-0" aria-hidden />
                Você caiu para a posição #{positionFeedback.position}
              </>
            )}
          </motion.p>
        )}
      </AnimatePresence>

      {entries.length === 0 ? (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="py-12">
            <p className="text-center text-sm text-muted-foreground">
              Ainda não há resultados publicados para este quiz.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {top3.length > 0 && (
            <div
              className={cn(
                "grid gap-4 sm:gap-4",
                top3.length === 1
                  ? "grid-cols-1 max-w-xs mx-auto"
                  : "grid-cols-1 sm:grid-cols-3"
              )}
            >
              {top3.length >= 2 && (
                <div className="order-2 sm:order-1 flex items-end">
                  <PodiumCard
                    entry={top3[1]}
                    position={2}
                    isCurrentUser={top3[1].userId === currentUserId}
                    isFirstPlace={false}
                    isScoreHighlight={highlightedUserIds.has(top3[1].userId)}
                  />
                </div>
              )}
              {top3.length >= 1 && (
                <div className="order-1 sm:order-2 flex items-end">
                  <PodiumCard
                    entry={top3[0]}
                    position={1}
                    isCurrentUser={top3[0].userId === currentUserId}
                    isFirstPlace
                    isScoreHighlight={highlightedUserIds.has(top3[0].userId)}
                  />
                </div>
              )}
              {top3.length >= 3 && (
                <div className="order-3 flex items-end">
                  <PodiumCard
                    entry={top3[2]}
                    position={3}
                    isCurrentUser={top3[2].userId === currentUserId}
                    isFirstPlace={false}
                    isScoreHighlight={highlightedUserIds.has(top3[2].userId)}
                  />
                </div>
              )}
            </div>
          )}

          {rest.length > 0 && (
            <Card className="overflow-hidden rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2" role="list">
                  <AnimatePresence mode="sync">
                    {rest.map((entry, index) => (
                      <RankingRow
                        key={entry.userId}
                        entry={entry}
                        position={index + 4}
                        isCurrentUser={entry.userId === currentUserId}
                        isScoreHighlight={highlightedUserIds.has(entry.userId)}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
