"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/quiz";
import { useSound } from "@/providers/SoundProvider";

const KEY_MAP = ["a", "s", "d", "f"] as const;

const OPTION_COLORS = [
  "bg-red-500 hover:bg-red-600 border-red-600",
  "bg-blue-500 hover:bg-blue-600 border-blue-600",
  "bg-yellow-500 hover:bg-yellow-600 border-yellow-600 text-yellow-950",
  "bg-green-500 hover:bg-green-600 border-green-600",
] as const;

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
  question: Question;
  onAnswer: (optionIndex: number) => void;
  disabled?: boolean;
  selectedIndex?: number | null;
  awaitingResult?: boolean;
}

export function QuestionCard({
  question,
  onAnswer,
  disabled = false,
  selectedIndex = null,
  awaitingResult = false,
}: QuestionCardProps) {
  const { playSelect } = useSound();
  const [keyPressed, setKeyPressed] = useState<number | null>(null);

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
      const index = KEY_MAP.indexOf(key as (typeof KEY_MAP)[number]);
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
      {awaitingResult && (
        <p className="text-center text-sm text-muted-foreground">
          Aguardando resultado...
        </p>
      )}
      <motion.div
        className="grid gap-3 sm:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        {question.options.map((option, index) => (
          <motion.button
            key={index}
            type="button"
            onClick={() => handleAnswer(index)}
            disabled={disabled}
            variants={itemVariants}
            whileHover={!disabled ? { scale: 1.02 } : undefined}
            whileTap={!disabled ? { scale: 0.98 } : undefined}
            animate={
              selectedIndex === index
                ? { scale: [1, 1.05, 1] }
                : keyPressed === index
                  ? { scale: [1, 1.05, 1] }
                  : { scale: 1 }
            }
            transition={
              selectedIndex === index || keyPressed === index
                ? { duration: 0.35, ease: "easeOut" }
                : { type: "spring", stiffness: 400, damping: 25 }
            }
            className={cn(
              "relative flex min-h-[80px] items-center justify-center rounded-xl border-2 px-4 py-3 text-center font-medium transition-colors",
              OPTION_COLORS[index],
              disabled && "cursor-not-allowed opacity-70",
              selectedIndex === index &&
                "ring-4 ring-white ring-offset-2 ring-offset-background",
              keyPressed === index &&
                selectedIndex === null &&
                "ring-2 ring-white ring-offset-2 ring-offset-background"
            )}
          >
            <span className="absolute left-2 top-2 rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs font-bold text-black/80">
              {KEY_MAP[index].toUpperCase()}
            </span>
            {option}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
