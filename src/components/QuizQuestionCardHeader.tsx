"use client";

import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Timer } from "@/components/Timer";

export const QUIZ_SURFACE_CARD_CLASS = "rounded-xl shadow-sm";

interface QuizQuestionCardHeaderProps {
  questionIndex: number;
  questionCount: number;
  subtitle: string;
  questionStartTimestamp: number | null;
  timeLimitMs: number;
}

export function QuizQuestionCardHeader({
  questionIndex,
  questionCount,
  subtitle,
  questionStartTimestamp,
  timeLimitMs,
}: QuizQuestionCardHeaderProps) {
  return (
    <CardHeader>
      <CardTitle>
        Pergunta {questionIndex + 1} de {questionCount}
      </CardTitle>
      <CardDescription>{subtitle}</CardDescription>
      <Timer
        questionStartTimestamp={questionStartTimestamp}
        timeLimitMs={timeLimitMs}
        size="large"
      />
    </CardHeader>
  );
}
