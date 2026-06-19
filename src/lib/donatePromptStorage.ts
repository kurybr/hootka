export type DonateTrigger =
  | "csv_export"
  | "host_game_finished"
  | "library_import";

export type DonatePromptAction = "dismiss" | "opened";

const STORAGE_PREFIX = "hootka_donate";

const COOLDOWN_MS = {
  csv_export: 30 * 24 * 60 * 60 * 1000,
  host_game_finished: 30 * 24 * 60 * 60 * 1000,
  library_import: 14 * 24 * 60 * 60 * 1000,
} as const;

const GAMES_FINISHED_KEY = `${STORAGE_PREFIX}_games_finished`;
const EXPORTS_DONE_KEY = `${STORAGE_PREFIX}_exports_done`;
const IMPORT_SESSION_KEY = `${STORAGE_PREFIX}_import_session_shown`;
const LAST_SHOWN_PREFIX = `${STORAGE_PREFIX}_last_shown_`;

function getStorage(): Storage | null {
  if (typeof globalThis.localStorage === "undefined") return null;
  return globalThis.localStorage;
}

function readInt(key: string, defaultValue = 0): number {
  const storage = getStorage();
  if (!storage) return defaultValue;
  const raw = storage.getItem(key);
  if (!raw) return defaultValue;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function writeInt(key: string, value: number): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(key, String(Math.max(0, Math.floor(value))));
}

function readTimestamp(key: string): number | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(key);
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function writeTimestamp(key: string, value: number): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(key, String(value));
}

function isCooldownActive(trigger: DonateTrigger, now = Date.now()): boolean {
  const lastShown = readTimestamp(`${LAST_SHOWN_PREFIX}${trigger}`);
  if (lastShown === null) return false;
  return now - lastShown < COOLDOWN_MS[trigger];
}

export function incrementLocalCounter(
  name: "games_finished" | "exports_done"
): number {
  const key = name === "games_finished" ? GAMES_FINISHED_KEY : EXPORTS_DONE_KEY;
  const next = readInt(key) + 1;
  writeInt(key, next);
  return next;
}

export function getLocalCounter(
  name: "games_finished" | "exports_done"
): number {
  const key = name === "games_finished" ? GAMES_FINISHED_KEY : EXPORTS_DONE_KEY;
  return readInt(key);
}

export function markLibraryImportSessionShown(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(IMPORT_SESSION_KEY, "1");
}

export function clearLibraryImportSessionShown(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(IMPORT_SESSION_KEY);
}

function wasLibraryImportShownThisSession(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  return storage.getItem(IMPORT_SESSION_KEY) === "1";
}

/** Quando true, ignora cooldown e contadores (útil para validar a UX). */
export function isDonatePromptAlwaysShow(): boolean {
  return process.env.NEXT_PUBLIC_DONATE_PROMPT_ALWAYS_SHOW === "true";
}

export function shouldShowDonatePrompt(
  trigger: DonateTrigger,
  options?: { isHostContext?: boolean; now?: number; alwaysShow?: boolean }
): boolean {
  const isHostContext = options?.isHostContext ?? true;
  if (!isHostContext) return false;

  const alwaysShow = options?.alwaysShow ?? isDonatePromptAlwaysShow();
  if (alwaysShow) return true;

  const now = options?.now ?? Date.now();

  if (isCooldownActive(trigger, now)) return false;

  if (trigger === "csv_export") {
    return true;
  }

  if (trigger === "library_import") {
    return !wasLibraryImportShownThisSession();
  }

  if (trigger === "host_game_finished") {
    const gamesFinished = getLocalCounter("games_finished");
    if (gamesFinished < 3) return false;
    return gamesFinished % 3 === 0;
  }

  return false;
}

export function recordDonatePromptShown(
  trigger: DonateTrigger,
  action: DonatePromptAction,
  now = Date.now()
): void {
  writeTimestamp(`${LAST_SHOWN_PREFIX}${trigger}`, now);

  if (trigger === "library_import") {
    markLibraryImportSessionShown();
  }

  if (action === "opened" && trigger === "host_game_finished") {
    // cooldown already recorded
  }
}

export function resetDonatePromptStorageForTests(): void {
  const storage = getStorage();
  if (!storage) return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => storage.removeItem(key));
}
