/**
 * Fixtures e credenciais para testes E2E da sala global com Firebase Emulator.
 * Usuários e quiz são criados pelo scripts/seed-emulator.ts.
 */
export const SEED_USERS = {
  user: {
    email: "user@test.local",
    password: "test123456",
    uid: "user-verificado",
    username: "Usuário Teste",
  },
  admin: {
    email: "admin@test.local",
    password: "admin123456",
    uid: "admin-verificado",
    username: "Admin Teste",
  },
} as const;

export const SEED_QUIZ = {
  slug: "quiz-de-teste-e2e",
  title: "Quiz de Teste E2E",
  url: "/quizzes/quiz-de-teste-e2e",
} as const;
