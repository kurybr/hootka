"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExportedQuiz } from "@/types/quiz";

interface ImportQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizzes: ExportedQuiz | ExportedQuiz[];
  onConfirm: (selected: ExportedQuiz[]) => void;
}

function QuizPreview({ quiz, selected, onToggle }: { quiz: ExportedQuiz; selected: boolean; onToggle: () => void }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
        selected ? "border-primary bg-primary/5" : "border-muted hover:bg-muted/50"
      )}
      onClick={onToggle}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => {}}
        className="mt-1 h-4 w-4 rounded border-gray-300"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium">{quiz.title}</p>
        <p className="text-sm text-muted-foreground">
          {quiz.questions.length} pergunta{quiz.questions.length !== 1 ? "s" : ""}
        </p>
        {quiz.questions.length > 0 && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {quiz.questions.slice(0, 3).map((q) => q.text).join(" • ")}
          </p>
        )}
      </div>
    </div>
  );
}

export function ImportQuizDialog({
  open,
  onOpenChange,
  quizzes,
  onConfirm,
}: ImportQuizDialogProps) {
  const items = Array.isArray(quizzes) ? quizzes : [quizzes];
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(items.map((_, i) => i))
  );

  const handleToggle = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedQuizzes = items.filter((_, i) => selected.has(i));
    onConfirm(selectedQuizzes);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar quiz{items.length > 1 ? "s" : ""}</DialogTitle>
          <DialogDescription>
            {items.length > 1
              ? `O arquivo contém ${items.length} quizzes. Selecione quais deseja importar.`
              : "Confira o preview e clique em Importar para adicionar à biblioteca."}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto space-y-2 py-2 -mx-1 px-1">
          {items.map((quiz, index) => (
            <QuizPreview
              key={index}
              quiz={quiz}
              selected={selected.has(index)}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selected.size === 0}
          >
            Importar {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
