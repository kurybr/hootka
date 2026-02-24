#!/usr/bin/env node
/**
 * Script para consultar o Firebase Realtime Database.
 * Uso: node scripts/check-firebase-db.mjs
 */
import { createRequire } from "module";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Carregar .env
const dotenv = await import("dotenv");
dotenv.config({ path: resolve(__dirname, "../.env") });
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const admin = require("firebase-admin");
const { resolve: pathResolve } = await import("path");

const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
const rawPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const credentialsPath = rawPath?.startsWith("/")
  ? rawPath
  : rawPath
    ? pathResolve(process.cwd(), rawPath)
    : undefined;

if (!databaseURL) {
  console.error("NEXT_PUBLIC_FIREBASE_DATABASE_URL não definido");
  process.exit(1);
}

if (!credentialsPath) {
  console.error("GOOGLE_APPLICATION_CREDENTIALS não definido");
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(credentialsPath),
    databaseURL,
  });
} catch (e) {
  console.error("Erro ao inicializar Firebase Admin:", e.message);
  process.exit(1);
}

const db = admin.database();

async function readPath(path) {
  const ref = db.ref(path);
  const snap = await ref.once("value");
  return snap.val();
}

async function main() {
  console.log("\n=== Firebase Realtime Database - Consulta ===\n");

  const rooms = await readPath("rooms");
  const users = await readPath("users");

  console.log("--- ROOMS ---");
  if (!rooms || typeof rooms !== "object") {
    console.log("(vazio ou inexistente)");
  } else {
    const roomIds = Object.keys(rooms);
    console.log(`Total de salas: ${roomIds.length}`);
    for (const id of roomIds.slice(0, 5)) {
      const r = rooms[id];
      console.log(`\n  [${id}]`);
      console.log(`    code: ${r?.code ?? "-"}`);
      console.log(`    status: ${r?.status ?? "-"}`);
      console.log(`    hostId: ${r?.hostId ?? "-"}`);
      console.log(`    participants: ${r?.participants ? Object.keys(r.participants).length : 0}`);
      console.log(`    questions: ${r?.questions?.length ?? 0}`);
    }
    if (roomIds.length > 5) {
      console.log(`\n  ... e mais ${roomIds.length - 5} sala(s)`);
    }
  }

  console.log("\n--- USERS ---");
  if (!users || typeof users !== "object") {
    console.log("(vazio ou inexistente)");
  } else {
    const userIds = Object.keys(users);
    console.log(`Total de usuários: ${userIds.length}`);
    for (const uid of userIds.slice(0, 5)) {
      const u = users[uid];
      const profile = u?.profile;
      const quizCount = u?.quizzes ? Object.keys(u.quizzes).length : 0;
      console.log(`\n  [${uid}]`);
      console.log(`    displayName: ${profile?.displayName ?? "-"}`);
      console.log(`    email: ${profile?.email ?? "-"}`);
      console.log(`    quizzes: ${quizCount}`);
    }
    if (userIds.length > 5) {
      console.log(`\n  ... e mais ${userIds.length - 5} usuário(s)`);
    }
  }

  console.log("\n=== Fim da consulta ===\n");
  process.exit(0);
}

main().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
