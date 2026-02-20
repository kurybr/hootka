"use client";

import { cn } from "@/lib/utils";
import type { Question } from "@/types/quiz";

const OPTION_COLORS = [
  "bg-red-500 hover:bg-red-600 border-red-600",
  "bg-blue-500 hover:bg-blue-600 border-blue-600",
  "bg-yellow-500 hover:bg-yellow-600 border-yellow-600 text-yellow-950",
  "bg-green-500 hover:bg-green-600 border-green-600",
] as const;

interface QuestionCardProps {
  question: Question;
  onAnswer: (optionIndex: number) => void;
  disabled?: boolean;
  selectedIndex?: number | null;
}

export function QuestionCard({
  question,
  onAnswer,
  disabled = false,
  selectedIndex = null,
}: QuestionCardProps) {
  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">{question.text}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => !disabled && onAnswer(index)}
            disabled={disabled}
            className={cn(
              "flex min-h-[60px] items-center justify-center rounded-xl border-2 px-4 py-3 text-center font-medium transition-all",
              OPTION_COLORS[index],
              disabled && "cursor-not-allowed opacity-70",
              selectedIndex === index && "ring-4 ring-white ring-offset-2 ring-offset-background"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
