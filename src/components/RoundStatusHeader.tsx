"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useTimer } from "@/hooks/useTimer";
import {
  PLAYER_AWAITING_OTHERS_MESSAGE,
  PLAYER_TIMEOUT_NEXT_MESSAGE,
} from "@/lib/playerMicrocopy";
import { DEFAULT_QUESTION_TIME_LIMIT_MS } from "@/lib/questionUtils";
import { useSound } from "@/providers/SoundProvider";
import { cn } from "@/lib/utils";

export type RoundStatus =
  | "answering"
  | "answer-registered"
  | "timed-out"
  | "correct"
  | "incorrect";

interface RoundStatusHeaderProps {
  state: RoundStatus;
  questionStartTimestamp?: number | null;
  timeLimitMs?: number;
  score?: number;
  size?: "default" | "large";
  className?: string;
  /** Layout compacto no mobile — somente fluxo do jogador em rodada ativa. */
  mobileCompact?: boolean;
}

interface FrozenTimerSnapshot {
  progress: number;
  timeLeft: number;
}

const STATUS_LABEL: Record<RoundStatus, string> = {
  answering: "Tempo restante",
  "answer-registered": "Resposta registrada",
  "timed-out": "Tempo esgotado",
  correct: "Resultado",
  incorrect: "Resultado",
};

const SECONDARY_RIGHT_TEXT_CLASS =
  "text-right text-sm font-medium text-muted-foreground";

const ANSWERING_COUNTER_CLASS =
  "font-mono text-3xl font-bold tabular-nums text-foreground";

const ANSWERING_LABEL_CLASS = "text-sm font-medium text-muted-foreground";

const STATUS_LABEL_CLASS = "shrink-0 text-lg font-semibold";

export function resolvePlayingRoundStatus(
  isExpired: boolean,
  selectedIndex: number | null,
  awaitingResult: boolean
): RoundStatus {
  if (isExpired && selectedIndex === null) return "timed-out";
  if (awaitingResult && selectedIndex !== null) return "answer-registered";
  return "answering";
}

export function resolveResultRoundStatus(correct: boolean): RoundStatus {
  return correct ? "correct" : "incorrect";
}

function RoundStatusRight({
  state,
  timeLeft,
  displayScore,
}: {
  state: RoundStatus;
  timeLeft: number;
  displayScore: MotionValue<number>;
}) {
  switch (state) {
    case "answering":
      return <span>{timeLeft}s</span>;
    case "answer-registered":
      return <span>{PLAYER_AWAITING_OTHERS_MESSAGE}</span>;
    case "timed-out":
      return <span>{PLAYER_TIMEOUT_NEXT_MESSAGE}</span>;
    case "correct":
      return (
        <span>
          Acertou • +<motion.span className="tabular-nums">{displayScore}</motion.span>{" "}
          pts
        </span>
      );
    case "incorrect":
      return (
        <span>
          Errou • +<motion.span className="tabular-nums">{displayScore}</motion.span>{" "}
          pts
        </span>
      );
  }
}

function getProgressBarColor(timeLeft: number): string {
  if (timeLeft > 30) return "bg-green-500";
  if (timeLeft > 10) return "bg-yellow-500";
  return "bg-red-500";
}

export function RoundStatusHeader({
  state,
  questionStartTimestamp = null,
  timeLimitMs = DEFAULT_QUESTION_TIME_LIMIT_MS,
  score = 0,
  size = "large",
  className,
  mobileCompact = false,
}: RoundStatusHeaderProps) {
  const { timeLeft, isExpired, progress } = useTimer(
    questionStartTimestamp,
    timeLimitMs
  );
  const { playTick } = useSound();
  const lastTickRef = useRef<number | null>(null);
  const spring = useSpring(0, { stiffness: 50, damping: 25 });
  const displayScore = useTransform(spring, (v) => Math.round(v));
  const [frozenSnapshot, setFrozenSnapshot] = useState<FrozenTimerSnapshot | null>(
    null
  );
  const prevStateRef = useRef(state);

  useEffect(() => {
    if (state === "answering") {
      setFrozenSnapshot(null);
    } else if (state === "timed-out") {
      setFrozenSnapshot({ progress: 0, timeLeft: 0 });
    } else if (
      prevStateRef.current === "answering" &&
      state === "answer-registered"
    ) {
      setFrozenSnapshot({ progress, timeLeft });
    } else if (state === "correct" || state === "incorrect") {
      setFrozenSnapshot((prev) => prev ?? { progress: 0, timeLeft: 0 });
    }
    prevStateRef.current = state;
  }, [state, progress, timeLeft]);

  const progressValue = (() => {
    switch (state) {
      case "answering":
        return progress;
      case "answer-registered":
        return frozenSnapshot?.progress ?? progress;
      case "timed-out":
        return 0;
      case "correct":
      case "incorrect":
        return frozenSnapshot?.progress ?? 0;
    }
  })();

  const barTimeLeft =
    state === "answer-registered"
      ? (frozenSnapshot?.timeLeft ?? timeLeft)
      : state === "answering"
        ? timeLeft
        : 0;

  const isCritical = state === "answering" && timeLeft > 0 && timeLeft <= 5;

  useEffect(() => {
    if (state === "correct" || state === "incorrect") {
      spring.set(score);
    }
  }, [state, score, spring]);

  useEffect(() => {
    if (
      state !== "answering" ||
      !questionStartTimestamp ||
      isExpired ||
      timeLeft > 5
    ) {
      return;
    }
    if (lastTickRef.current !== timeLeft) {
      lastTickRef.current = timeLeft;
      playTick();
    }
  }, [state, timeLeft, isExpired, questionStartTimestamp, playTick]);

  const rightAriaLabel = (() => {
    switch (state) {
      case "answering":
        return `${timeLeft} segundos restantes`;
      case "answer-registered":
        return PLAYER_AWAITING_OTHERS_MESSAGE;
      case "timed-out":
        return PLAYER_TIMEOUT_NEXT_MESSAGE;
      case "correct":
        return `Acertou, mais ${score} pontos`;
      case "incorrect":
        return `Errou, mais ${score} pontos`;
    }
  })();

  const isAnswering = state === "answering";
  const hideStatusRowOnMobile = mobileCompact && isAnswering;
  const stackResultOnMobile =
    mobileCompact && (state === "correct" || state === "incorrect");
  const hideSecondaryOnMobile =
    mobileCompact &&
    (state === "answer-registered" || state === "timed-out");

  const barColor =
    state === "timed-out" || state === "correct" || state === "incorrect"
      ? "bg-muted-foreground/20"
      : getProgressBarColor(barTimeLeft);

  return (
    <div
      className={cn(
        "space-y-2",
        size === "large" && "space-y-3",
        mobileCompact && "max-md:space-y-2",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`${STATUS_LABEL[state]}: ${rightAriaLabel}`}
    >
      <div
        className={cn(
          "flex justify-between gap-4",
          isAnswering ? "items-end" : "items-center",
          hideStatusRowOnMobile && "max-md:hidden",
          stackResultOnMobile && "max-md:flex-col max-md:items-start max-md:gap-1",
          hideSecondaryOnMobile && "max-md:justify-start"
        )}
      >
        <span
          className={cn(
            isAnswering ? ANSWERING_LABEL_CLASS : STATUS_LABEL_CLASS,
            hideSecondaryOnMobile && "max-md:text-base max-md:font-semibold"
          )}
        >
          {STATUS_LABEL[state]}
        </span>
        <span
          className={cn(
            "min-w-0 text-right",
            isAnswering
              ? cn(
                  ANSWERING_COUNTER_CLASS,
                  isCritical && "text-destructive"
                )
              : SECONDARY_RIGHT_TEXT_CLASS,
            hideSecondaryOnMobile && "max-md:hidden",
            stackResultOnMobile && "max-md:text-left"
          )}
        >
          <RoundStatusRight
            state={state}
            timeLeft={timeLeft}
            displayScore={displayScore}
          />
        </span>
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-full bg-muted",
          size === "large" ? "h-3" : "h-2",
          mobileCompact && "max-md:h-2"
        )}
      >
        <motion.div
          className={cn("h-full transition-colors duration-300", barColor)}
          style={{ width: `${progressValue * 100}%` }}
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
