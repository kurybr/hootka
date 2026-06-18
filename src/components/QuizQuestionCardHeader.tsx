"use client";

import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoundStatusHeader, type RoundStatus } from "@/components/RoundStatusHeader";
import { Timer } from "@/components/Timer";

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
}

export function QuizQuestionCardHeader({
  questionIndex,
  questionCount,
  subtitle,
  questionStartTimestamp,
  timeLimitMs,
  roundStatus,
  roundScore,
}: QuizQuestionCardHeaderProps) {
  return (
    <CardHeader
      className={roundStatus !== undefined ? QUIZ_PLAYER_CARD_HEADER_CLASS : undefined}
    >
      <CardTitle className="leading-snug">
        Pergunta {questionIndex + 1} de {questionCount}
      </CardTitle>
      {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      {roundStatus !== undefined ? (
        <RoundStatusHeader
          state={roundStatus}
          questionStartTimestamp={questionStartTimestamp}
          timeLimitMs={timeLimitMs}
          score={roundScore}
          size="large"
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
