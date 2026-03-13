#!/usr/bin/env -S npx tsx
/**
 * Limpa todo o Realtime Database (rooms, users, globalQuizzes, etc.).
 *
 * Uso:
 *   npx tsx scripts/clear-database.ts --confirm
 *
 * Requer --confirm para evitar execução acidental.
 * Carrega .env e .env.local do diretório raiz do projeto.
 */
import { config } from "dotenv";
import { resolve } from "path";
import { clearEntireDatabase } from "../src/server/clearDatabase";

const projectRoot = resolve(__dirname, "..");
config({ path: resolve(projectRoot, ".env") });
config({ path: resolve(projectRoot, ".env.local") });

const confirmed = process.argv.includes("--confirm");

async function main() {
  if (!confirmed) {
    console.error("Uso: npx tsx scripts/clear-database.ts --confirm");
    console.error("O flag --confirm é obrigatório para executar a limpeza.");
    process.exit(1);
  }

  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (!databaseURL) {
    console.error("NEXT_PUBLIC_FIREBASE_DATABASE_URL não definido. Configure .env ou .env.local");
    process.exit(1);
  }

  console.log("Banco que será limpo:", databaseURL);
  console.log("Removendo todos os dados...");

  try {
    const { cleared } = await clearEntireDatabase();
    console.log("Limpeza concluída. Paths removidos:", cleared.join(", "));
  } catch (err) {
    console.error("Erro ao limpar o banco:", err);
    process.exit(1);
  }
}

main();
