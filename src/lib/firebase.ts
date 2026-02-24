import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

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
  return getDatabase(app);
}

export const ROOMS_PATH = "rooms";
