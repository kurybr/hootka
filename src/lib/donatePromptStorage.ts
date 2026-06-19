export type DonateTrigger = "csv_export" | "library_import" | "quiz_ai_generate";

export type DonatePromptAction = "dismiss" | "opened";

const STORAGE_PREFIX = "hootka_donate";

const COOLDOWN_MS = {
  csv_export: 30 * 24 * 60 * 60 * 1000,
  library_import: 14 * 24 * 60 * 60 * 1000,
  quiz_ai_generate: 7 * 24 * 60 * 60 * 1000,
} as const;

const IMPORT_SESSION_KEY = `${STORAGE_PREFIX}_import_session_shown`;
const LAST_SHOWN_PREFIX = `${STORAGE_PREFIX}_last_shown_`;

function getStorage(): Storage | null {
  if (typeof globalThis.localStorage === "undefined") return null;
  return globalThis.localStorage;
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

  if (trigger === "csv_export" || trigger === "quiz_ai_generate") {
    return true;
  }

  if (trigger === "library_import") {
    return !wasLibraryImportShownThisSession();
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
