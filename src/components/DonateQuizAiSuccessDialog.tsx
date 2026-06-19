"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COPY = {
  global: {
    title: "✨ Desafio gerado com sucesso",
    description: "Seu desafio está pronto para edição.",
  },
  live: {
    title: "✨ Sala montada com sucesso",
    description: "Suas perguntas estão prontas para edição.",
  },
} as const;

interface DonateQuizAiSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHowToSupport: () => void;
  onContinue: () => void;
  variant?: "live" | "global";
}

export function DonateQuizAiSuccessDialog({
  open,
  onOpenChange,
  onHowToSupport,
  onContinue,
  variant = "global",
}: DonateQuizAiSuccessDialogProps) {
  const copy = COPY[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] gap-0 px-6 py-7 sm:px-8 sm:py-8">
        <DialogHeader className="space-y-3 text-left sm:text-left">
          <DialogTitle className="font-heading text-xl font-normal leading-snug">
            {copy.title}
          </DialogTitle>
          <DialogDescription asChild>
            <p className="text-sm text-muted-foreground">{copy.description}</p>
          </DialogDescription>
        </DialogHeader>

        <Button type="button" className="mt-6 w-full" autoFocus onClick={onContinue}>
          Continuar editando
        </Button>

        <div
          className="my-7 border-t border-border/60"
          role="presentation"
          aria-hidden="true"
        />

        <div className="text-xs leading-relaxed text-muted-foreground/75">
          <p>
            Se ele te economizou alguns minutos hoje,
            <br />
            considere pagar um café para quem fez o Hootka ☕
          </p>
          <Button
            type="button"
            variant="link"
            className="mt-1 h-auto cursor-pointer justify-start p-0 text-xs font-medium text-primary no-underline underline-offset-4 hover:underline"
            onClick={onHowToSupport}
          >
            ☕ Quero agradecer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
