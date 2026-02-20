"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/quiz";
import { useSound } from "@/providers/SoundProvider";

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

  const handleClick = (index: number) => {
    if (disabled) return;
    playSelect();
    onAnswer(index);
  };

  return (
    <div className="space-y-4">
      <motion.p
        className="text-lg font-medium"
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
            onClick={() => handleClick(index)}
            disabled={disabled}
            variants={itemVariants}
            whileHover={!disabled ? { scale: 1.02 } : undefined}
            whileTap={!disabled ? { scale: 0.98 } : undefined}
            animate={
              selectedIndex === index
                ? { scale: [1, 1.05, 1] }
                : { scale: 1 }
            }
            transition={
              selectedIndex === index
                ? { duration: 0.35, ease: "easeOut" }
                : { type: "spring", stiffness: 400, damping: 25 }
            }
            className={cn(
              "flex min-h-[60px] items-center justify-center rounded-xl border-2 px-4 py-3 text-center font-medium transition-colors",
              OPTION_COLORS[index],
              disabled && "cursor-not-allowed opacity-70",
              selectedIndex === index &&
                "ring-4 ring-white ring-offset-2 ring-offset-background"
            )}
          >
            {option}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
