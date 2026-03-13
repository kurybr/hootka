import { resolve } from "path";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

let adminApp: App | null = null;

const USE_EMULATOR =
  process.env.FIREBASE_AUTH_EMULATOR_HOST != null ||
  process.env.FIREBASE_DATABASE_EMULATOR_HOST != null;

function getFirebaseAdminApp(): App | null {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApps()[0] as App;
    return adminApp;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    (USE_EMULATOR ? "demo-test" : undefined);

  const databaseURL = USE_EMULATOR
    ? process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
      `http://127.0.0.1:9000?ns=${projectId || "demo-test"}`
    : process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (!databaseURL) {
    return null;
  }

  try {
    if (USE_EMULATOR) {
      adminApp = initializeApp({
        projectId: projectId || "demo-test",
        databaseURL,
      });
      return adminApp;
    }

    const rawPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const credentialsPath = rawPath?.startsWith("/")
      ? rawPath
      : rawPath
        ? resolve(process.cwd(), rawPath)
        : undefined;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (credentialsPath) {
      adminApp = initializeApp({
        credential: cert(credentialsPath),
        databaseURL,
      });
    } else if (projectId && clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL,
      });
    } else {
      return null;
    }
    return adminApp;
  } catch {
    return null;
  }
}

export function getFirebaseAdminDatabase() {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return getDatabase(app);
}

export function getFirebaseAdminAuth() {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return getAuth(app);
}

export const ROOMS_PATH = "rooms";
export const GLOBAL_QUIZZES_PATH = "globalQuizzes";
export const GLOBAL_QUIZ_SLUGS_PATH = "globalQuizSlugs";
export const GLOBAL_QUIZ_ATTEMPTS_PATH = "globalQuizAttempts";
export const GLOBAL_QUIZ_USER_STATS_PATH = "globalQuizUserStats";
export const GLOBAL_QUIZ_LEADERBOARD_PATH = "globalQuizLeaderboard";
