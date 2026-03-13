import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
const EMULATOR_AUTH_URL = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL || "http://127.0.0.1:9099";
const EMULATOR_DB_HOST = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1";
const EMULATOR_DB_PORT = parseInt(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_EMULATOR_PORT || "9000", 10);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || (USE_EMULATOR ? "demo-key" : undefined),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || (USE_EMULATOR ? "localhost" : undefined),
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    (USE_EMULATOR ? `http://${EMULATOR_DB_HOST}:${EMULATOR_DB_PORT}?ns=demo-test` : undefined),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || (USE_EMULATOR ? "demo-test" : undefined),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || (USE_EMULATOR ? "demo-test.appspot.com" : undefined),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || (USE_EMULATOR ? "123" : undefined),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || (USE_EMULATOR ? "demo-app" : undefined),
};

let emulatorAuthConnected = false;
let emulatorDbConnected = false;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null; // Client-only
  if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) return null;

  const existingApp = getApps()[0];
  if (existingApp) return existingApp as FirebaseApp;

  return initializeApp(firebaseConfig);
}

export function getFirebaseDatabase() {
  const app = getFirebaseApp();
  if (!app) return null;
  const db = getDatabase(app);
  if (USE_EMULATOR && !emulatorDbConnected) {
    connectDatabaseEmulator(db, EMULATOR_DB_HOST, EMULATOR_DB_PORT);
    emulatorDbConnected = true;
  }
  return db;
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  if (!app) return null;
  const auth = getAuth(app);
  if (USE_EMULATOR && !emulatorAuthConnected) {
    connectAuthEmulator(auth, EMULATOR_AUTH_URL, { disableWarnings: true });
    emulatorAuthConnected = true;
  }
  return auth;
}

export const ROOMS_PATH = "rooms";
export const GLOBAL_QUIZZES_PATH = "globalQuizzes";
export const GLOBAL_QUIZ_SLUGS_PATH = "globalQuizSlugs";
export const GLOBAL_QUIZ_ATTEMPTS_PATH = "globalQuizAttempts";
export const GLOBAL_QUIZ_USER_STATS_PATH = "globalQuizUserStats";
export const GLOBAL_QUIZ_LEADERBOARD_PATH = "globalQuizLeaderboard";
