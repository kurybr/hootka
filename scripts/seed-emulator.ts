#!/usr/bin/env -S npx tsx
/**
 * Seed do Firebase Emulator para testes E2E locais.
 * Cria usuários e quizzes globais determinísticos.
 *
 * Uso (com emuladores rodando em outro terminal):
 *   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
 *   FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 \
 *   npx tsx scripts/seed-emulator.ts
 *
 * Ou: npm run emulators:seed
 */
import { config } from "dotenv";
import { resolve } from "path";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminDatabase,
  GLOBAL_QUIZZES_PATH,
  GLOBAL_QUIZ_SLUGS_PATH,
} from "../src/lib/firebaseAdmin";
import { clearEntireDatabase } from "../src/server/clearDatabase";
import type { GlobalQuiz, Question } from "../types/quiz";

const projectRoot = resolve(__dirname, "..");
config({ path: resolve(projectRoot, ".env") });
config({ path: resolve(projectRoot, ".env.local") });
config({ path: resolve(projectRoot, ".env.test") });

const USER_VERIFICADO = {
  email: "user@test.local",
  password: "test123456",
  uid: "user-verificado",
  username: "Usuário Teste",
  role: "user" as const,
};

const ADMIN_VERIFICADO = {
  email: "admin@test.local",
  password: "admin123456",
  uid: "admin-verificado",
  username: "Admin Teste",
  role: "admin" as const,
};

const QUIZ_FIXTURE: { title: string; questions: Question[] } = {
  title: "Quiz de Teste E2E",
  questions: [
    {
      text: "Qual a capital do Brasil?",
      options: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
      correctOptionIndex: 2,
    },
    {
      text: "Quanto é 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctOptionIndex: 1,
    },
  ],
};

async function main() {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
    console.error(
      "Defina FIREBASE_AUTH_EMULATOR_HOST e FIREBASE_DATABASE_EMULATOR_HOST."
    );
    console.error("Ex: FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 npx tsx scripts/seed-emulator.ts");
    process.exit(1);
  }

  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDatabase();

  if (!auth || !db) {
    console.error("Firebase Admin não inicializado. Verifique as variáveis de ambiente.");
    process.exit(1);
  }

  console.log("Limpando banco...");
  await clearEntireDatabase();

  console.log("Criando usuários no Auth Emulator...");
  try {
    await auth.createUser({
      uid: USER_VERIFICADO.uid,
      email: USER_VERIFICADO.email,
      password: USER_VERIFICADO.password,
      emailVerified: true,
      displayName: USER_VERIFICADO.username,
    });
    console.log("  - user@test.local (user-verificado)");
  } catch (e) {
    if ((e as { code?: string }).code === "auth/uid-already-exists") {
      console.log("  - user@test.local já existe");
    } else {
      throw e;
    }
  }

  try {
    await auth.createUser({
      uid: ADMIN_VERIFICADO.uid,
      email: ADMIN_VERIFICADO.email,
      password: ADMIN_VERIFICADO.password,
      emailVerified: true,
      displayName: ADMIN_VERIFICADO.username,
    });
    console.log("  - admin@test.local (admin-verificado)");
  } catch (e) {
    if ((e as { code?: string }).code === "auth/uid-already-exists") {
      console.log("  - admin@test.local já existe");
    } else {
      throw e;
    }
  }

  console.log("Criando perfis...");
  await db.ref(`users/${USER_VERIFICADO.uid}/profile`).set({
    username: USER_VERIFICADO.username,
    role: USER_VERIFICADO.role,
  });
  await db.ref(`users/${ADMIN_VERIFICADO.uid}/profile`).set({
    username: ADMIN_VERIFICADO.username,
    role: ADMIN_VERIFICADO.role,
  });

  console.log("Criando quiz global...");
  const now = Date.now();
  const quizId = "quiz-e2e-fixture";
  const slug = "quiz-de-teste-e2e";
  const quiz: GlobalQuiz = {
    id: quizId,
    slug,
    title: QUIZ_FIXTURE.title,
    description: "Quiz para testes E2E da sala global",
    topic: "Teste",
    questions: QUIZ_FIXTURE.questions,
    visibility: "community",
    status: "published",
    attemptLimit: null,
    questionTimeLimitMs: 30000,
    createdBy: USER_VERIFICADO.uid,
    createdByUsername: USER_VERIFICADO.username,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
  };
  await db.ref(`${GLOBAL_QUIZZES_PATH}/${quizId}`).set(quiz);
  await db.ref(`${GLOBAL_QUIZ_SLUGS_PATH}/${slug}`).set(quizId);

  console.log("Seed concluído.");
  console.log("Usuários: user@test.local / test123456 | admin@test.local / admin123456");
  console.log("Quiz: /quizzes/quiz-de-teste-e2e");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
