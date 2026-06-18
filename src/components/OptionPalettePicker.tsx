"use client";

import { cn } from "@/lib/utils";
import {
  QUIZ_OPTION_PALETTES,
  getOptionButtonStyle,
} from "@/lib/quizOptionPalettes";
import type { QuizOptionPaletteId } from "@/types/quiz";
import { DEFAULT_QUIZ_OPTION_PALETTE_ID } from "@/types/quiz";

interface OptionPalettePickerProps {
  value?: QuizOptionPaletteId;
  onChange: (paletteId: QuizOptionPaletteId) => void;
}

function PaletteSwatches({ paletteId }: { paletteId: QuizOptionPaletteId }) {
  const palette = QUIZ_OPTION_PALETTES.find((item) => item.id === paletteId);
  if (!palette) return null;

  return (
    <div className="flex gap-1.5">
      {palette.colors.map((color) => (
        <span
          key={color}
          className="h-6 w-6 rounded-md border border-black/10 shadow-sm"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      ))}
    </div>
  );
}

function PalettePreview({ paletteId }: { paletteId: QuizOptionPaletteId }) {
  const labels = ["A", "B", "C", "D"];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {labels.map((label, index) => {
        const style = getOptionButtonStyle(paletteId, index);
        return (
          <div
            key={label}
            className="flex min-h-10 items-center justify-center rounded-lg border-2 px-2 py-2 text-sm font-semibold"
            style={{
              backgroundColor: style.backgroundColor,
              borderColor: style.borderColor,
              color: style.color,
              textShadow: style.textShadow,
            }}
          >
            {label}
          </div>
        );
      })}
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

      <div className="grid gap-3 sm:grid-cols-2">
        {QUIZ_OPTION_PALETTES.map((palette) => {
          const isSelected = selected === palette.id;
          return (
            <label
              key={palette.id}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition-colors",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border hover:bg-muted/40"
              )}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="option-palette"
                  checked={isSelected}
                  onChange={() => onChange(palette.id)}
                  className="shrink-0"
                />
                <span className="text-sm font-medium">{palette.label}</span>
              </span>
              <PaletteSwatches paletteId={palette.id} />
            </label>
          );
        })}
      </div>

      <div className="space-y-2 rounded-xl border bg-muted/20 p-4">
        <p className="text-xs font-medium text-muted-foreground">Prévia</p>
        <PalettePreview paletteId={selected} />
      </div>
    </div>
  );
}
