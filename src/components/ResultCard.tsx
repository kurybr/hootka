"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import {
  getOptionButtonStyle,
  getOptionResultClassName,
  OPTION_DEEMPHASIZED_OPACITY,
  type OptionButtonVisualState,
} from "@/lib/quizOptionPalettes";
import { cn } from "@/lib/utils";
import { useSound } from "@/providers/SoundProvider";
import type { Question, QuizOptionPaletteId } from "@/types/quiz";

const OPTION_TRANSITION = { duration: 0.3 } as const;

interface ResultCardProps {
  question: Question;
  optionPaletteId?: QuizOptionPaletteId;
  selectedIndex: number | null;
  score: number;
  correct: boolean;
}

export function ResultCard({
  question,
  optionPaletteId,
  selectedIndex,
  score,
  correct,
}: ResultCardProps) {
  const { playVictory, playDefeat } = useSound();
  const didNotAnswer = selectedIndex === null;

  useEffect(() => {
    if (correct) playVictory();
    else playDefeat();
  }, [correct, playVictory, playDefeat]);

  return (
    <div>
      <p className="mb-6 text-lg font-medium">{question.text}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option, index) => {
          const isCorrectOption = index === question.correctOptionIndex;
          const isSelected = index === selectedIndex;
          const showWrong = !correct && isSelected && !isCorrectOption;

          let visualState: OptionButtonVisualState = "active";
          if (!didNotAnswer) {
            if (isCorrectOption) {
              visualState = "correct";
            } else if (showWrong) {
              visualState = "incorrect";
            }
          }

          const isHighlighted = visualState === "correct" || visualState === "incorrect";
          const isDeemphasized = didNotAnswer || !isHighlighted;

          const optionStyle = getOptionButtonStyle(
            optionPaletteId,
            index,
            visualState
          );

          return (
            <motion.div
              key={index}
              className={cn(
                getOptionResultClassName(optionStyle.usesSubtleBorder),
                "transition-all duration-300"
              )}
              style={{
                backgroundColor: optionStyle.backgroundColor,
                ...(!optionStyle.usesSubtleBorder && {
                  borderColor: optionStyle.borderColor,
                }),
                color: optionStyle.color,
                textShadow: optionStyle.textShadow,
              }}
              animate={{
                opacity: isDeemphasized ? OPTION_DEEMPHASIZED_OPACITY : 1,
                scale: 1,
              }}
              transition={OPTION_TRANSITION}
            >
              {option}
              {isCorrectOption && !didNotAnswer && (
                <Check
                  className="ml-2 h-5 w-5 shrink-0"
                  style={{ color: optionStyle.color }}
                  aria-hidden
                />
              )}
              {showWrong && (
                <X
                  className="ml-2 h-5 w-5 shrink-0"
                  style={{ color: optionStyle.color }}
                  aria-hidden
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
