import type { Answer, Question, Room } from "@/types/quiz";

/** RTDB pode serializar arrays como objetos com chaves "0","1",… */
export function normalizeQuestionsFromRtdb(raw: unknown): Question[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as Question[];
  if (typeof raw === "object") {
    const obj = raw as Record<string, Question>;
    return Object.keys(obj)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => obj[k])
      .filter((item): item is Question => item != null && typeof item === "object");
  }
  return [];
}

/**
 * RTDB pode devolver `answers` como objeto ou como array (chaves 0, 1, 2…).
 * Object.entries funciona nos dois casos.
 */
export function normalizeAnswersFromRtdb(raw: unknown): Room["answers"] {
  if (raw == null || typeof raw !== "object") return {};
  const result: Room["answers"] = {};
  for (const [qKey, qAnswers] of Object.entries(raw as Record<string, unknown>)) {
    if (qAnswers != null && typeof qAnswers === "object" && !Array.isArray(qAnswers)) {
      result[qKey] = qAnswers as Record<string, Answer>;
    }
  }
  return result;
}
