#!/usr/bin/env node
/**
 * Executa cenário B (burst) ou C (jogo completo).
 * Inicia seed-and-start em background (host mantém jogo ativo), executa artillery.
 */

const { spawn } = require("child_process");
const path = require("path");

async function createSeedAndStart() {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [path.join(__dirname, "seed-and-start.js")], {
      stdio: ["inherit", "pipe", "inherit"],
    });
    let output = "";
    const timeout = setTimeout(() => reject(new Error("Timeout: seed-and-start não respondeu em 15s")), 15000);
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      try {
        const data = JSON.parse(output.trim());
        clearTimeout(timeout);
        resolve({ code: data.code, child });
      } catch {
        // ainda não tem JSON completo
      }
    });
    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function main() {
  const scenario = process.argv[2] || "B-burst-response";
  const artilleryArgs = process.argv.slice(3);
  const scenarioPath = path.join(__dirname, "scenarios", `${scenario}.yml`);

  console.log("Criando sala e iniciando jogo...");
  const { code, child } = await createSeedAndStart();
  console.log("Sala criada. Código:", code);
  console.log("Executando Artillery...\n");

  const env = { ...process.env, ROOM_CODE: code };
  const art = spawn("npx", ["artillery", "run", scenarioPath, ...artilleryArgs], {
    stdio: "inherit",
    env,
  });

  art.on("close", (code) => {
    child.kill();
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
