import type { QuizOptionPaletteId } from "@/types/quiz";

export const OPTION_TEXT_LIGHT = "#FFFFFF";
export const OPTION_TEXT_DARK = "#1F1A17";
export const OPTION_SUBTLE_BORDER = "hsl(var(--border))";
export const MIN_CONTRAST_RATIO = 4.5;
export const LIGHT_BACKGROUND_LUMINANCE = 0.85;

export const QUIZ_FEEDBACK_COLORS = {
  /** success — acerto */
  correct: "#22C55E",
  /** destructive — erro do jogador */
  incorrect: "#DC2626",
} as const;

export const OPTION_DEEMPHASIZED_OPACITY = 0.5;

export interface QuizOptionPalette {
  id: QuizOptionPaletteId;
  label: string;
  colors: [string, string, string, string];
}

export type OptionButtonVisualState =
  | "active"
  | "selected"
  | "correct"
  | "incorrect";

export const QUIZ_OPTION_PALETTES: QuizOptionPalette[] = [
  {
    id: "hootka",
    label: "Hootka",
    colors: ["#3F7B70", "#D14B24", "#8E2E1E", "#D9C491"],
  },
  {
    id: "copa",
    label: "Brasil",
    colors: ["#007A33", "#FFDF00", "#002776", "#FFFFFF"],
  },
  {
    id: "lgbt",
    label: "Pride",
    colors: ["#E40303", "#FF8C00", "#FFED00", "#732982"],
  },
  {
    id: "dia",
    label: "Dia",
    colors: ["#0EA5E9", "#FDE047", "#FDBA74", "#22C55E"],
  },
  {
    id: "lua",
    label: "Lua",
    colors: ["#312E81", "#6366F1", "#A78BFA", "#E2E8F0"],
  },
];

const PALETTE_BY_ID = new Map(
  QUIZ_OPTION_PALETTES.map((palette) => [palette.id, palette])
);

export function resolveQuizOptionPaletteId(
  value: unknown
): QuizOptionPaletteId {
  if (typeof value === "string" && PALETTE_BY_ID.has(value as QuizOptionPaletteId)) {
    return value as QuizOptionPaletteId;
  }
  return "hootka";
}

export function getQuizOptionPalette(
  paletteId: QuizOptionPaletteId | undefined
): QuizOptionPalette {
  return PALETTE_BY_ID.get(resolveQuizOptionPaletteId(paletteId))!;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const int = Number.parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const foregroundLuminance = relativeLuminance(foregroundHex);
  const backgroundLuminance = relativeLuminance(backgroundHex);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function getOptionTextShadow(textColor: string): string | undefined {
  if (textColor === OPTION_TEXT_LIGHT) {
    return "0 1px 2px rgba(0, 0, 0, 0.45)";
  }
  return "0 1px 2px rgba(255, 255, 255, 0.55)";
}

export function getOptionTextColor(backgroundHex: string): string {
  const lightContrast = getContrastRatio(OPTION_TEXT_LIGHT, backgroundHex);
  const darkContrast = getContrastRatio(OPTION_TEXT_DARK, backgroundHex);
  return lightContrast >= darkContrast ? OPTION_TEXT_LIGHT : OPTION_TEXT_DARK;
}

export function getOptionSelectionRingColor(backgroundHex: string): string {
  return getOptionTextColor(backgroundHex) === OPTION_TEXT_LIGHT
    ? OPTION_TEXT_LIGHT
    : OPTION_TEXT_DARK;
}

function getReadableTextStyle(backgroundHex: string): {
  color: string;
  textShadow?: string;
} {
  const color = getOptionTextColor(backgroundHex);
  const contrast = getContrastRatio(color, backgroundHex);

  if (contrast >= MIN_CONTRAST_RATIO) {
    return { color };
  }

  return {
    color,
    textShadow: getOptionTextShadow(color),
  };
}

function darkenHex(hex: string, amount = 0.12): string {
  const [r, g, b] = hexToRgb(hex);
  const factor = 1 - amount;
  const toHex = (channel: number) =>
    Math.max(0, Math.min(255, Math.round(channel * factor)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function needsSubtleOptionBorder(backgroundColor: string): boolean {
  return relativeLuminance(backgroundColor) >= LIGHT_BACKGROUND_LUMINANCE;
}

function getOptionBorderColor(backgroundColor: string): string {
  if (needsSubtleOptionBorder(backgroundColor)) {
    return OPTION_SUBTLE_BORDER;
  }
  return darkenHex(backgroundColor);
}

export interface OptionButtonStyle {
  backgroundColor: string;
  borderColor: string;
  color: string;
  textShadow?: string;
  selectionRingColor: string;
  usesSubtleBorder: boolean;
}

function buildOptionButtonStyle(backgroundColor: string): OptionButtonStyle {
  const textStyle = getReadableTextStyle(backgroundColor);
  const usesSubtleBorder = needsSubtleOptionBorder(backgroundColor);

  return {
    backgroundColor,
    borderColor: getOptionBorderColor(backgroundColor),
    color: textStyle.color,
    textShadow: textStyle.textShadow,
    selectionRingColor: getOptionSelectionRingColor(backgroundColor),
    usesSubtleBorder,
  };
}

export function getOptionButtonStyle(
  paletteId: QuizOptionPaletteId | undefined,
  index: number,
  state: OptionButtonVisualState = "active"
): OptionButtonStyle {
  if (state === "correct") {
    return buildOptionButtonStyle(QUIZ_FEEDBACK_COLORS.correct);
  }

  if (state === "incorrect") {
    return buildOptionButtonStyle(QUIZ_FEEDBACK_COLORS.incorrect);
  }

  const palette = getQuizOptionPalette(paletteId);
  const safeIndex = Math.max(0, Math.min(index, palette.colors.length - 1));
  return buildOptionButtonStyle(palette.colors[safeIndex]);
}

export function getOptionButtonClassName(
  disabled = false,
  usesSubtleBorder = false
): string {
  return [
    `flex h-full min-h-[92px] w-full items-center gap-4 rounded-xl px-4 py-3 font-semibold transition-all duration-300`,
    usesSubtleBorder ? "border border-zinc-300 shadow-sm" : "border-2",
    disabled ? "cursor-not-allowed" : "hover:brightness-95",
  ].join(" ");
}

export function getOptionResultClassName(usesSubtleBorder = false): string {
  return [
    `flex min-h-[60px] items-center justify-center rounded-xl px-4 py-3 text-center font-semibold transition-all duration-300`,
    usesSubtleBorder ? "border border-zinc-300 shadow-sm" : "border-2",
  ].join(" ");
}
