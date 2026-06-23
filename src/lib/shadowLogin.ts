export const SHADOW_SESSION_KEY = "hootka_shadow_session";

export interface ShadowSession {
  email: string;
  uid: string;
  startedAt: number;
}

export function isShadowLoginEnabledServer(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_SHADOW_LOGIN === "true"
  );
}

export function isShadowLoginEnabledClient(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ALLOW_SHADOW_LOGIN === "true"
  );
}

export function readShadowSession(): ShadowSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SHADOW_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ShadowSession;
    if (!parsed.email || !parsed.uid) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeShadowSession(session: ShadowSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SHADOW_SESSION_KEY, JSON.stringify(session));
}

export function clearShadowSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SHADOW_SESSION_KEY);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeShadowEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidShadowEmail(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeShadowEmail(email));
}
