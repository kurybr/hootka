"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { fireConfetti } from "@/lib/confetti";
import type { RankedParticipant } from "@/hooks/useRanking";

interface FinalRankingProps {
  participants: RankedParticipant[];
  currentParticipantId?: string | null;
  className?: string;
}

function PodiumName({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <p className={cn("w-full min-w-0 truncate text-center", className)} title={name}>
      {name}
    </p>
  );
}

export function FinalRanking({
  participants,
  currentParticipantId = null,
  className,
}: FinalRankingProps) {
  const top3 = participants.slice(0, 3);
  const hasFired = useRef(false);

  useEffect(() => {
    if (participants.length > 0 && !hasFired.current) {
      hasFired.current = true;
      const t = setTimeout(fireConfetti, 300);
      return () => clearTimeout(t);
    }
  }, [participants.length]);

  return (
    <motion.div
      className={cn("space-y-6", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.h2
        className="text-center text-2xl font-bold"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Ranking Final
      </motion.h2>

      {top3.length > 0 && (
        <motion.div
          className="flex max-w-full items-end justify-center gap-2 px-1 sm:gap-4 sm:px-0"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          {top3[1] && (
            <div className="flex w-[6.5rem] shrink-0 flex-col items-center sm:w-[7.25rem]">
              <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800">
                <Medal className="h-8 w-8 text-slate-400" />
              </div>
              <div className="flex min-h-[6.25rem] w-full flex-col justify-center rounded-lg border-2 border-slate-300 bg-slate-50 px-3 py-4 dark:border-slate-600 dark:bg-slate-800">
                <p className="text-center font-bold">2º</p>
                <PodiumName name={top3[1].name} className="font-medium" />
                <p className="text-center font-mono text-lg font-bold text-slate-600 dark:text-slate-300">
                  {top3[1].totalScore} pts
                </p>
              </div>
            </div>
          )}
          {top3[0] && (
            <div className="flex w-[7.25rem] shrink-0 flex-col items-center sm:w-[8.25rem]">
              <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/50">
                <Trophy className="h-10 w-10 text-amber-500" />
              </div>
              <div className="flex min-h-[7rem] w-full flex-col justify-center rounded-lg border-2 border-amber-400 bg-amber-50 px-3 py-5 dark:border-amber-500 dark:bg-amber-950/50">
                <PodiumName name={top3[0].name} className="text-lg font-bold" />
                <p className="text-center font-bold text-amber-700 dark:text-amber-400">
                  🥇 1º lugar
                </p>
                <p className="text-center font-mono text-xl font-bold text-amber-700 dark:text-amber-400">
                  {top3[0].totalScore} pts
                </p>
              </div>
            </div>
          )}
          {top3[2] && (
            <div className="flex w-[6.5rem] shrink-0 flex-col items-center sm:w-[7.25rem]">
              <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-700 bg-amber-100/50 dark:border-amber-500 dark:bg-amber-900/50">
                <Award className="h-6 w-6 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="flex min-h-[5.75rem] w-full flex-col justify-center rounded-lg border-2 border-amber-700 bg-amber-100/50 px-3 py-3 dark:border-amber-500 dark:bg-amber-900/50">
                <p className="text-center font-bold">3º</p>
                <PodiumName name={top3[2].name} className="font-medium" />
                <p className="text-center font-mono font-bold text-amber-800 dark:text-amber-300">
                  {top3[2].totalScore} pts
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
