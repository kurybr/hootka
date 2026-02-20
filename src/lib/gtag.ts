/**
 * Utilitários para Google Analytics (GA4).
 * Eventos customizados para métricas do quiz.
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const GA_ENABLED =
  process.env.NEXT_PUBLIC_GA_ENABLED !== "false" && !!GA_MEASUREMENT_ID;

export type GAEventName =
  | "room_created"
  | "room_joined"
  | "game_started"
  | "game_finished";

export function trackEvent(
  eventName: GAEventName,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window !== "undefined" && window.gtag && GA_ENABLED) {
    window.gtag("event", eventName, params);
  }
}
