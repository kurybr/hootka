import { resolve } from "path";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

let adminApp: App | null = null;

function getFirebaseAdminApp(): App | null {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApps()[0] as App;
    return adminApp;
  }

  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const rawPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const credentialsPath = rawPath?.startsWith("/")
    ? rawPath
    : rawPath
      ? resolve(process.cwd(), rawPath)
      : undefined;
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!databaseURL) {
    return null;
  }

  try {
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

export const ROOMS_PATH = "rooms";
