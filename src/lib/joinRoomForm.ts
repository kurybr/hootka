import {
  PLAYER_DISPLAY_NAME_MAX,
  PLAYER_DISPLAY_NAME_MIN,
} from "@/lib/playerIdentity";

export function normalizeRoomCode(input: string): string {
  return input.replace(/\s/g, "").toUpperCase().slice(0, 6);
}

export function formatRoomCodeDisplay(val: string): string {
  return normalizeRoomCode(val).split("").join(" ");
}

export function validateRoomCode(code: string): string | null {
  const trimmed = normalizeRoomCode(code);
  if (!trimmed) return "Informe o código da sala";
  if (trimmed.length !== 6) return "O código deve ter exatamente 6 caracteres";
  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    return "O código deve conter apenas letras e números";
  }
  return null;
}

export function validatePlayerName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Informe seu nome";
  if (trimmed.length < PLAYER_DISPLAY_NAME_MIN) {
    return "O nome deve ter pelo menos 2 caracteres";
  }
  if (trimmed.length > PLAYER_DISPLAY_NAME_MAX) {
    return "O nome deve ter no máximo 30 caracteres";
  }
  return null;
}

export function mapJoinError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("sala não encontrada") || raw === "SALA_NAO_ENCONTRADA") {
    return "Sala não encontrada";
  }
  if (lower.includes("sala cheia") || raw === "SALA_CHEIA") {
    return "Sala cheia";
  }
  if (
    lower.includes("não foi possível conectar") ||
    lower.includes("servidor indisponível") ||
    lower.includes("conexão perdida") ||
    lower.includes("timeout")
  ) {
    return "Conexão perdida. Tente novamente.";
  }
  return raw;
}
