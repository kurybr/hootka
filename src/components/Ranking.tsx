"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award, WifiOff, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RankedParticipant } from "@/hooks/useRanking";

interface RankingProps {
  participants: RankedParticipant[];
  currentParticipantId?: string | null;
  className?: string;
  size?: "default" | "large";
  /** Previous ranking (from last result screen) for position change indicators */
  previousParticipants?: RankedParticipant[];
  /** Called when current player enters Top 3 for the first time (e.g. for confetti) */
  onCurrentPlayerEnterTop3?: () => void;
}

const TOP_COLORS = [
  "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100",
  "border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200",
  "border-amber-700 bg-amber-100/50 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
] as const;

const POSITION_INDICATOR_DURATION_MS = 2500;
const SCORE_HIGHLIGHT_DURATION_MS = 800;

export function Ranking({
  participants,
  currentParticipantId = null,
  className,
  size = "default",
  previousParticipants,
  onCurrentPlayerEnterTop3,
}: RankingProps) {
  const [positionChanges, setPositionChanges] = useState<Record<string, number>>({});
  const [scoreHighlightIds, setScoreHighlightIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (participants.length === 0) return;

    const prev = previousParticipants ?? [];
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    if (prev.length > 0) {
      const changes: Record<string, number> = {};
      for (const p of participants) {
        const prevP = prev.find((x) => x.id === p.id);
        if (prevP && prevP.position !== p.position) {
          changes[p.id] = prevP.position - p.position;
        }
      }
      if (Object.keys(changes).length > 0) {
        setPositionChanges(changes);
        timeouts.push(setTimeout(() => setPositionChanges({}), POSITION_INDICATOR_DURATION_MS));

        if (currentParticipantId && onCurrentPlayerEnterTop3) {
          const prevPos = prev.find((x) => x.id === currentParticipantId)?.position ?? 999;
          const newPos = participants.find((x) => x.id === currentParticipantId)?.position ?? 999;
          if (prevPos > 3 && newPos <= 3) {
            onCurrentPlayerEnterTop3();
          }
        }
      }

      const scoreChanged = new Set<string>();
      for (const p of participants) {
        const prevP = prev.find((x) => x.id === p.id);
        if (prevP && prevP.totalScore !== p.totalScore) {
          scoreChanged.add(p.id);
        }
      }
      if (scoreChanged.size > 0) {
        setScoreHighlightIds(scoreChanged);
        timeouts.push(setTimeout(() => setScoreHighlightIds(new Set()), SCORE_HIGHLIGHT_DURATION_MS));
      }
    }

    return () => timeouts.forEach(clearTimeout);
  }, [participants, previousParticipants, currentParticipantId, onCurrentPlayerEnterTop3]);

  return (
    <div className={cn("space-y-2", size === "large" && "space-y-3", className)}>
      <h3 className={cn("font-medium", size === "large" ? "text-base lg:text-lg" : "text-sm")}>Ranking</h3>
      <ul className={cn("space-y-2", size === "large" && "space-y-3")}>
        <AnimatePresence mode="sync">
          {participants.map((p) => {
            const isTop3 = p.position <= 3;
            const isCurrent = p.id === currentParticipantId;
            const isDisconnected = p.connected === false;
            const topStyle = isTop3 ? TOP_COLORS[p.position - 1] : "";
            const positionDelta = positionChanges[p.id];
            const isScoreHighlight = scoreHighlightIds.has(p.id);

            return (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border transition-colors duration-300",
                  size === "large" ? "px-4 py-3 text-base" : "px-3 py-2",
                  isTop3 && topStyle,
                  isCurrent && !isTop3 && "border-primary bg-primary/10 font-medium",
                  isDisconnected && "opacity-60",
                  isScoreHighlight && "bg-primary/10"
                )}
              >
                <span className="flex w-8 shrink-0 items-center justify-center">
                  {p.position === 1 && <Trophy className="h-5 w-5 text-amber-500" aria-hidden />}
                  {p.position === 2 && <Medal className="h-5 w-5 text-slate-400" aria-hidden />}
                  {p.position === 3 && <Award className="h-5 w-5 text-amber-700" aria-hidden />}
                  {p.position > 3 && (
                    <span className="text-sm font-medium text-muted-foreground">
                      {p.position}º
                    </span>
                  )}
                </span>
                <span className="flex-1 truncate">{p.name}</span>
                <span
                  className={cn(
                    "font-mono font-semibold tabular-nums",
                    size === "large" && "text-lg"
                  )}
                >
                  {p.totalScore} pts
                </span>
                {positionDelta !== undefined && positionDelta !== 0 && (
                  <AnimatePresence>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        positionDelta > 0
                          ? "bg-green-100 text-green-800 dark:bg-green-950/70 dark:text-green-200"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200"
                      )}
                    >
                      {positionDelta > 0 ? (
                        <>
                          <ArrowUp className="h-3 w-3 shrink-0" aria-hidden />
                          +{positionDelta} {positionDelta === 1 ? "posição" : "posições"}
                        </>
                      ) : (
                        <>
                          <ArrowDown className="h-3 w-3 shrink-0" aria-hidden />
                          {positionDelta} {positionDelta === -1 ? "posição" : "posições"}
                        </>
                      )}
                    </motion.span>
                  </AnimatePresence>
                )}
                {isDisconnected && (
                  <span
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                    title="Desconectado"
                  >
                    <WifiOff className="h-4 w-4" aria-hidden />
                    desconectado
                  </span>
                )}
                {isCurrent && !isDisconnected && (
                  <span className="text-xs text-muted-foreground">(você)</span>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
