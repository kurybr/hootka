"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
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
  const spring = useSpring(0, { stiffness: 50, damping: 25 });
  const displayScore = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    if (correct) playVictory();
    else playDefeat();
  }, [correct, playVictory, playDefeat]);

  useEffect(() => {
    spring.set(score);
  }, [score, spring]);

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
        <motion.span className="font-mono text-lg font-bold">
          +<motion.span>{displayScore}</motion.span> pts
        </motion.span>
      </div>

      <p className="text-lg font-medium">{question.text}</p>

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
                borderColor: optionStyle.borderColor,
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
