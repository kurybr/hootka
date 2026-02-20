"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/quiz";

const OPTION_COLORS = [
  "bg-red-500/80 border-red-600",
  "bg-blue-500/80 border-blue-600",
  "bg-yellow-500/80 border-yellow-600 text-yellow-950",
  "bg-green-500/80 border-green-600",
] as const;

interface ResultCardProps {
  question: Question;
  selectedIndex: number | null;
  score: number;
  correct: boolean;
}

export function ResultCard({
  question,
  selectedIndex,
  score,
  correct,
}: ResultCardProps) {
  const didNotAnswer = selectedIndex === null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {correct ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-green-800 dark:bg-green-900/50 dark:text-green-200">
            <Check className="h-6 w-6" />
            <span className="font-bold">Acertou!</span>
          </div>
        ) : didNotAnswer ? (
          <div className="flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
            <X className="h-6 w-6" />
            <span className="font-bold">Tempo esgotado!</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-red-800 dark:bg-red-900/50 dark:text-red-200">
            <X className="h-6 w-6" />
            <span className="font-bold">Errou!</span>
          </div>
        )}
        <span className="font-mono text-lg font-bold">
          +{score} pts
        </span>
      </div>

      <p className="text-lg font-medium">{question.text}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option, index) => {
          const isCorrect = index === question.correctOptionIndex;
          const isSelected = index === selectedIndex;
          const showWrong = !correct && isSelected;

          return (
            <div
              key={index}
              className={cn(
                "flex min-h-[60px] items-center justify-center rounded-xl border-2 px-4 py-3 text-center font-medium",
                OPTION_COLORS[index],
                isCorrect && "border-green-600 bg-green-500 ring-2 ring-green-400",
                showWrong && "border-red-600 bg-red-500 ring-2 ring-red-400"
              )}
            >
              {option}
              {isCorrect && (
                <Check className="ml-2 h-5 w-5 text-white" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
