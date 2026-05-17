/** Validação de nome exibido no ranking (quiz global) e políticas alinhadas ao join da sala. */

export const PLAYER_DISPLAY_NAME_MIN = 2;
export const PLAYER_DISPLAY_NAME_MAX = 30;

export function isValidPlayerDisplayName(name: string | null | undefined): boolean {
  if (name == null) return false;
  const t = name.trim();
  if (t.length < PLAYER_DISPLAY_NAME_MIN || t.length > PLAYER_DISPLAY_NAME_MAX) {
    return false;
  }
  return true;
}

export function assertValidPlayerDisplayName(name: string | null | undefined): void {
  if (!isValidPlayerDisplayName(name)) {
    throw new Error("PROFILE_USERNAME_REQUIRED");
  }
}
