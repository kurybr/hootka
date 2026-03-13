/**
 * Global setup do Playwright para testes da sala global.
 * Faz seed do Firebase Emulator quando NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true.
 */
import { execSync } from "child_process";
import { resolve } from "path";

async function globalSetup() {
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== "true") {
    return;
  }

  console.log("Seed do Firebase Emulator...");
  const root = resolve(__dirname, "../..");
  execSync("npx tsx scripts/seed-emulator.ts", {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099",
      FIREBASE_DATABASE_EMULATOR_HOST:
        process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000",
      NEXT_PUBLIC_FIREBASE_DATABASE_URL:
        process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "http://127.0.0.1:9000?ns=hootkaapp",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hootkaapp",
    },
  });
}

export default globalSetup;
