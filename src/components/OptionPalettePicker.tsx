"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  QUIZ_OPTION_PALETTES,
  getOptionButtonStyle,
  getQuizOptionPalette,
} from "@/lib/quizOptionPalettes";
import type { QuizOptionPaletteId } from "@/types/quiz";
import { DEFAULT_QUIZ_OPTION_PALETTE_ID } from "@/types/quiz";
import { Card } from "@/components/ui/card";

interface OptionPalettePickerProps {
  value?: QuizOptionPaletteId;
  onChange: (paletteId: QuizOptionPaletteId) => void;
}

const PREVIEW_OPTIONS = ["Resposta A", "Resposta B", "Resposta C", "Resposta D"];
const PREVIEW_LABELS = ["A", "B", "C", "D"];

const PALETTE_META: Record<
  QuizOptionPaletteId,
  { displayLabel: string; description: string }
> = {
  hootka: {
    displayLabel: "Hootka",
    description: "A paleta oficial do Hootka",
  },
  lgbt: {
    displayLabel: "Pride 🌈",
    description: "Inspirada nas cores do orgulho",
  },
  copa: {
    displayLabel: "Brasil 🇧🇷",
    description: "As cores da bandeira brasileira",
  },
  dia: {
    displayLabel: "Dia 🌞",
    description: "Leve, alegre e descontraída",
  },
  lua: {
    displayLabel: "Lua 🌙",
    description: "Inspirada no céu noturno",
  },
};

function PaletteSwatches({ paletteId }: { paletteId: QuizOptionPaletteId }) {
  const palette = getQuizOptionPalette(paletteId);

  return (
    <div className="grid grid-cols-4 gap-2">
      {palette.colors.map((color) => (
        <span
          key={color}
          className="h-8 min-w-0 rounded-md border border-border"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      ))}
    </div>
  );
}

function PalettePreview({ paletteId }: { paletteId: QuizOptionPaletteId }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">Pergunta exemplo</p>
      <div className="space-y-2">
        {PREVIEW_OPTIONS.map((optionText, index) => {
          const style = getOptionButtonStyle(paletteId, index, "active");
          const label = PREVIEW_LABELS[index];

          return (
            <div
              key={label}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold",
                style.usesSubtleBorder ? "border" : "border-2"
              )}
              style={{
                backgroundColor: style.backgroundColor,
                borderColor: style.borderColor,
                color: style.color,
                textShadow: style.textShadow,
              }}
            >
              <span className="shrink-0 tabular-nums">[{label}]</span>
              <span>{optionText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OptionPalettePicker({ value, onChange }: OptionPalettePickerProps) {
  const selected = value ?? DEFAULT_QUIZ_OPTION_PALETTE_ID;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Cores das alternativas</p>
        <p className="text-xs text-muted-foreground">
          Escolha o conjunto de cores dos botões de resposta.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="sr-only">Paleta de cores das alternativas</legend>
        <div className="flex flex-col gap-3" role="radiogroup" aria-label="Paleta de cores">
          {QUIZ_OPTION_PALETTES.map((palette) => {
            const isSelected = selected === palette.id;
            const inputId = `option-palette-${palette.id}`;
            const meta = PALETTE_META[palette.id];

            return (
              <motion.div
                key={palette.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.15 }}
                className="w-full"
              >
                <Card
                  className={cn(
                    "overflow-hidden transition-all duration-150",
                    "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
                    isSelected
                      ? "border-primary shadow-sm ring-2 ring-primary/30"
                      : "border-border shadow-none hover:bg-accent/30"
                  )}
                >
                  <label
                    htmlFor={inputId}
                    className="flex cursor-pointer flex-col gap-3 rounded-xl px-4 py-3"
                  >
                    <span className="space-y-0.5">
                      <span className="block text-sm font-medium">{meta.displayLabel}</span>
                      <span className="block text-xs text-muted-foreground">
                        {meta.description}
                      </span>
                    </span>
                    <PaletteSwatches paletteId={palette.id} />
                    <input
                      id={inputId}
                      type="radio"
                      name="option-palette"
                      value={palette.id}
                      checked={isSelected}
                      onChange={() => onChange(palette.id)}
                      className="sr-only"
                    />
                  </label>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </fieldset>

      <Card className="border-border shadow-none">
        <div className="space-y-4 p-4">
          <p className="text-sm font-medium">Prévia</p>
          <PalettePreview paletteId={selected} />
        </div>
      </Card>
    </div>
  );
}
