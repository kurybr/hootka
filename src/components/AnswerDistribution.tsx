"use client";

import { cn } from "@/lib/utils";
import { getOptionButtonStyle } from "@/lib/quizOptionPalettes";
import type { Question, QuizOptionPaletteId } from "@/types/quiz";

interface AnswerDistributionProps {
  question: Question;
  counts: number[];
  total: number;
  optionPaletteId?: QuizOptionPaletteId;
}

export function AnswerDistribution({
  question,
  counts,
  total,
  optionPaletteId,
}: AnswerDistributionProps) {
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Distribuição de respostas</h3>
      <p className="text-sm text-muted-foreground">{question.text}</p>

      <div className="space-y-3">
        {question.options.map((option, index) => {
          const count = counts[index];
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const isCorrect = index === question.correctOptionIndex;
          const optionStyle = getOptionButtonStyle(optionPaletteId, index);

          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span
                  className={cn(
                    "font-medium",
                    isCorrect && "text-green-600 dark:text-green-400"
                  )}
                >
                  {option}
                  {isCorrect && " ✓"}
                </span>
                <span className="text-muted-foreground">
                  {count} ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="h-6 overflow-hidden rounded-md bg-muted">
                <div
                  className={cn(
                    "h-full transition-all",
                    isCorrect && "ring-2 ring-green-500"
                  )}
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: optionStyle.backgroundColor,
                    borderRight: `2px solid ${optionStyle.borderColor}`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
