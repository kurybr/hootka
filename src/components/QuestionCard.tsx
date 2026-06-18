"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import {
  getOptionButtonClassName,
  getOptionButtonStyle,
  OPTION_DEEMPHASIZED_OPACITY,
} from "@/lib/quizOptionPalettes";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QUESTION_SHORTCUT_KEYS } from "@/lib/questionUtils";
import type { PublicQuestion, QuizOptionPaletteId } from "@/types/quiz";
import { useSound } from "@/providers/SoundProvider";

const OPTION_TRANSITION = { duration: 0.3 } as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: i * 0.05 },
  }),
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

interface QuestionCardProps {
  question: PublicQuestion;
  optionPaletteId?: QuizOptionPaletteId;
  onAnswer: (optionIndex: number) => void;
  disabled?: boolean;
  selectedIndex?: number | null;
  awaitingResult?: boolean;
  timedOut?: boolean;
}

export function QuestionCard({
  question,
  optionPaletteId,
  onAnswer,
  disabled = false,
  selectedIndex = null,
  awaitingResult = false,
  timedOut = false,
}: QuestionCardProps) {
  const { playSelect } = useSound();
  const [keyPressed, setKeyPressed] = useState<number | null>(null);

  const hasSelection = selectedIndex !== null;
  const isAwaitingOthers = awaitingResult && hasSelection && !timedOut;

  const handleAnswer = (index: number) => {
    if (disabled) return;
    playSelect();
    onAnswer(index);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled || selectedIndex !== null) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const key = e.key.toLowerCase();
      const index = QUESTION_SHORTCUT_KEYS.indexOf(
        key as (typeof QUESTION_SHORTCUT_KEYS)[number]
      );
      if (index === -1 || index >= question.options.length) return;

      e.preventDefault();
      setKeyPressed(index);
      playSelect();
      onAnswer(index);
      setTimeout(() => setKeyPressed(null), 150);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, selectedIndex, playSelect, onAnswer, question.options.length]);

  return (
    <div className="space-y-4">
      <motion.p
        className="text-xl font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {question.text}
      </motion.p>

      {timedOut && (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-foreground">⌛ Tempo esgotado</p>
          <p className="text-sm text-muted-foreground">Aguardando próxima pergunta...</p>
        </div>
      )}

      {isAwaitingOthers && (
        <div className="flex flex-col items-center gap-2">
          <Badge variant="secondary">✓ Resposta enviada</Badge>
          <p className="text-sm text-muted-foreground">
            Aguardando os demais participantes...
          </p>
        </div>
      )}

      <motion.div
        className="grid gap-3 sm:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        {question.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isDeemphasized =
            timedOut || (hasSelection && !isSelected);

          const optionStyle = getOptionButtonStyle(optionPaletteId, index, "active");
          const isKeyPressed = keyPressed === index && !hasSelection;
          const isInteractive = !disabled && !hasSelection && !timedOut;

          const motionAnimate = isDeemphasized
            ? { opacity: OPTION_DEEMPHASIZED_OPACITY, scale: 1 }
            : isKeyPressed
              ? { scale: [1, 1.05, 1], opacity: 1 }
              : { opacity: 1, scale: 1 };

          const motionTransition = isKeyPressed
            ? { duration: 0.35, ease: "easeOut" as const }
            : OPTION_TRANSITION;

          return (
            <motion.button
              key={index}
              type="button"
              onClick={() => handleAnswer(index)}
              disabled={disabled}
              variants={itemVariants}
              whileHover={isInteractive ? { scale: 1.02 } : undefined}
              whileTap={isInteractive ? { scale: 0.98 } : undefined}
              animate={motionAnimate}
              transition={motionTransition}
              className={cn(
                getOptionButtonClassName(
                  disabled,
                  optionStyle.usesSubtleBorder
                ),
                "transition-all duration-300"
              )}
              style={{
                backgroundColor: optionStyle.backgroundColor,
                borderColor: optionStyle.borderColor,
                color: optionStyle.color,
                textShadow: optionStyle.textShadow,
                boxShadow: isKeyPressed
                  ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${optionStyle.selectionRingColor}`
                  : undefined,
              }}
            >
              <span
                className={
                  optionStyle.usesSubtleBorder
                    ? "absolute left-2 top-2 rounded border border-border bg-muted/80 px-1.5 py-0.5 font-mono text-xs font-bold text-foreground"
                    : "absolute left-2 top-2 rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs font-bold text-black/80"
                }
              >
                {QUESTION_SHORTCUT_KEYS[index].toUpperCase()}
              </span>
              <span className="flex items-center justify-center gap-2">
                {option}
                {hasSelection && isSelected && (
                  <Check className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                )}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
