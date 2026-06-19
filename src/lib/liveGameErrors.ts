export const BENIGN_LIVE_GAME_ERROR_CODES = ["STATUS_INVALIDO"] as const;

export function isBenignLiveGameError(raw: string): boolean {
  return BENIGN_LIVE_GAME_ERROR_CODES.includes(
    raw as (typeof BENIGN_LIVE_GAME_ERROR_CODES)[number]
  );
}
