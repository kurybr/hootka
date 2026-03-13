import {
  getFirebaseAdminDatabase,
  ROOMS_PATH,
  GLOBAL_QUIZZES_PATH,
  GLOBAL_QUIZ_SLUGS_PATH,
  GLOBAL_QUIZ_ATTEMPTS_PATH,
  GLOBAL_QUIZ_USER_STATS_PATH,
  GLOBAL_QUIZ_LEADERBOARD_PATH,
} from "@/lib/firebaseAdmin";

/** Caminhos de primeiro nível no Realtime Database a serem removidos na limpeza total */
const TOP_LEVEL_PATHS = [
  ROOMS_PATH,
  "users",
  GLOBAL_QUIZZES_PATH,
  GLOBAL_QUIZ_SLUGS_PATH,
  GLOBAL_QUIZ_ATTEMPTS_PATH,
  GLOBAL_QUIZ_USER_STATS_PATH,
  GLOBAL_QUIZ_LEADERBOARD_PATH,
] as const;

/**
 * Remove todos os dados do Realtime Database (salas, usuários, quizzes globais,
 * tentativas, estatísticas e leaderboard). Use com cuidado em produção.
 */
export async function clearEntireDatabase(): Promise<{ cleared: string[] }> {
  const db = getFirebaseAdminDatabase();
  if (!db) {
    throw new Error("Firebase Admin não configurado");
  }

  const cleared: string[] = [];

  for (const path of TOP_LEVEL_PATHS) {
    await db.ref(path).remove();
    cleared.push(path);
  }

  return { cleared };
}
