import type { QuizOptionPaletteId } from "@/types/quiz";

export const OPTION_TEXT_LIGHT = "#FFFFFF";
export const OPTION_TEXT_DARK = "#1F1A17";
export const MIN_CONTRAST_RATIO = 4.5;

export interface QuizOptionPalette {
  id: QuizOptionPaletteId;
  label: string;
  colors: [string, string, string, string];
  discardedColor: string;
}

export type OptionButtonVisualState = "active" | "selected" | "discarded";

export const QUIZ_OPTION_PALETTES: QuizOptionPalette[] = [
  {
    id: "hootka",
    label: "Hootka",
    colors: ["#3F7B70", "#D14B24", "#8E2E1E", "#D9C491"],
    discardedColor: "#B5A99A",
  },
  {
    id: "copa",
    label: "Copa",
    colors: ["#009739", "#FFDF00", "#002776", "#F5F5F5"],
    discardedColor: "#BDBDBD",
  },
  {
    id: "lgbt",
    label: "LGBTQIA+",
    colors: ["#E40303", "#FF8C00", "#FFED00", "#740787"],
    discardedColor: "#B0B0B0",
  },
  {
    id: "dia",
    label: "Dia",
    colors: ["#4FC3F7", "#FFD54F", "#FF8A65", "#66BB6A"],
    discardedColor: "#B0BEC5",
  },
  {
    id: "lua",
    label: "Lua",
    colors: ["#283593", "#5E35B1", "#90A4AE", "#1A237E"],
    discardedColor: "#78909C",
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

export interface OptionButtonStyle {
  backgroundColor: string;
  borderColor: string;
  color: string;
  textShadow?: string;
  selectionRingColor: string;
}

function buildOptionButtonStyle(backgroundColor: string): OptionButtonStyle {
  const textStyle = getReadableTextStyle(backgroundColor);

  return {
    backgroundColor,
    borderColor: darkenHex(backgroundColor),
    color: textStyle.color,
    textShadow: textStyle.textShadow,
    selectionRingColor: getOptionSelectionRingColor(backgroundColor),
  };
}

export function getOptionButtonStyle(
  paletteId: QuizOptionPaletteId | undefined,
  index: number,
  state: OptionButtonVisualState = "active"
): OptionButtonStyle {
  const palette = getQuizOptionPalette(paletteId);

  if (state === "discarded") {
    return buildOptionButtonStyle(palette.discardedColor);
  }

  const safeIndex = Math.max(0, Math.min(index, palette.colors.length - 1));
  return buildOptionButtonStyle(palette.colors[safeIndex]);
}

export function getOptionButtonClassName(
  disabled = false,
  isDiscarded = false
): string {
  return [
    "relative flex min-h-[80px] items-center justify-center rounded-xl border-2 px-4 py-3 text-center font-semibold transition-colors duration-300",
    disabled || isDiscarded ? "cursor-not-allowed" : "hover:brightness-95",
  ].join(" ");
}

export function getOptionResultClassName(): string {
  return "flex min-h-[60px] items-center justify-center rounded-xl border-2 px-4 py-3 text-center font-semibold transition-colors duration-300";
}
