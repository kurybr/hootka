import { getFirebaseAdminDatabase } from "@/lib/firebaseAdmin";

/** Contador por usuário (Firebase UID). Escrito só pelo Admin SDK. */
export const QUIZ_AI_GENERATIONS_PATH = "usage/quizAiGenerations";

export function getMaxQuizAiGenerationsPerUser(): number {
  const raw = parseInt(process.env.QUIZ_AI_MAX_GENERATIONS_PER_USER ?? "10", 10);
  if (!Number.isFinite(raw) || raw < 1) return 10;
  return Math.min(raw, 1000);
}

export async function getQuizAiGenerationCount(uid: string): Promise<number> {
  const db = getFirebaseAdminDatabase();
  if (!db) return 0;
  const snap = await db.ref(`${QUIZ_AI_GENERATIONS_PATH}/${uid}`).get();
  const v = snap.val();
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Reserva 1 geração; retorna false se já estiver no limite ou DB indisponível. */
export async function tryReserveQuizAiGeneration(uid: string): Promise<boolean> {
  const db = getFirebaseAdminDatabase();
  if (!db) return false;
  const limit = getMaxQuizAiGenerationsPerUser();
  const ref = db.ref(`${QUIZ_AI_GENERATIONS_PATH}/${uid}`);
  const result = await ref.transaction((current) => {
    const n = typeof current === "number" && Number.isFinite(current) ? current : 0;
    if (n >= limit) return undefined;
    return n + 1;
  });
  return result.committed;
}

/** Devolve 1 slot após falha depois de reservar (ex.: OpenRouter ou validação). */
export async function refundQuizAiGeneration(uid: string): Promise<void> {
  const db = getFirebaseAdminDatabase();
  if (!db) return;
  const ref = db.ref(`${QUIZ_AI_GENERATIONS_PATH}/${uid}`);
  await ref.transaction((current) => {
    const n = typeof current === "number" && Number.isFinite(current) ? current : 0;
    return Math.max(0, n - 1);
  });
}
