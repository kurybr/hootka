"use client";

import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoundStatusHeader, type RoundStatus } from "@/components/RoundStatusHeader";
import { Timer } from "@/components/Timer";
import { cn } from "@/lib/utils";

export const QUIZ_SURFACE_CARD_CLASS = "rounded-xl shadow-sm";

/** Ritmo vertical do card no fluxo do jogador (pergunta ativa) */
export const QUIZ_PLAYER_CARD_HEADER_CLASS = "space-y-2 px-6 pt-7 pb-6";

/** Cabeçalho da tela de resultado (apenas RoundStatusHeader) */
export const QUIZ_PLAYER_RESULT_HEADER_CLASS = "px-6 pt-7 pb-6";

export const QUIZ_PLAYER_CARD_CONTENT_CLASS = "px-6 pb-8 pt-0";

interface QuizQuestionCardHeaderProps {
  questionIndex: number;
  questionCount: number;
  subtitle?: string;
  questionStartTimestamp: number | null;
  timeLimitMs: number;
  roundStatus?: RoundStatus;
  roundScore?: number;
  mobileCompact?: boolean;
}

export function QuizQuestionCardHeader({
  questionIndex,
  questionCount,
  subtitle,
  questionStartTimestamp,
  timeLimitMs,
  roundStatus,
  roundScore,
  mobileCompact = false,
}: QuizQuestionCardHeaderProps) {
  return (
    <CardHeader
      className={cn(
        roundStatus !== undefined ? QUIZ_PLAYER_CARD_HEADER_CLASS : undefined,
        mobileCompact &&
          "max-md:space-y-2 max-md:px-4 max-md:pt-4 max-md:pb-3"
      )}
    >
      <CardTitle className={cn("leading-snug", mobileCompact && "max-md:text-lg")}>
        Pergunta {questionIndex + 1} de {questionCount}
      </CardTitle>
      {subtitle ? (
        <CardDescription className={mobileCompact ? "max-md:hidden" : undefined}>
          {subtitle}
        </CardDescription>
      ) : null}
      {roundStatus !== undefined ? (
        <RoundStatusHeader
          state={roundStatus}
          questionStartTimestamp={questionStartTimestamp}
          timeLimitMs={timeLimitMs}
          score={roundScore}
          size="large"
          mobileCompact={mobileCompact}
        />
      ) : (
        <Timer
          questionStartTimestamp={questionStartTimestamp}
          timeLimitMs={timeLimitMs}
          size="large"
        />
      )}
    </CardHeader>
  );
}
