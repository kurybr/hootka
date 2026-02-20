#!/usr/bin/env node
/**
 * Cria uma sala seed e executa o teste de carga com o código obtido.
 * Uso: node load-tests/run-with-seed.js [cenário] [opções artillery]
 * Ex: node load-tests/run-with-seed.js join-and-play
 * Ex: node load-tests/run-with-seed.js join-and-play --output results/run.json
 */

const { spawn } = require("child_process");
const path = require("path");

async function createSeed() {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [path.join(__dirname, "seed-quiz.js")], {
      stdio: ["inherit", "pipe", "inherit"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("close", (code) => {
      if (code !== 0) reject(new Error("Falha ao criar sala seed"));
      try {
        const data = JSON.parse(output.trim());
        resolve(data.code);
      } catch {
        reject(new Error("Resposta inválida do seed-quiz.js"));
      }
    });
  });
}

async function main() {
  const scenario = process.argv[2] || "join-and-play";
  const artilleryArgs = process.argv.slice(3);
  const scenarioPath = path.join(__dirname, "scenarios", `${scenario}.yml`);

  console.log("Criando sala seed...");
  const roomCode = await createSeed();
  console.log("Sala criada. Código:", roomCode);
  console.log("Executando Artillery...\n");

  const env = { ...process.env, ROOM_CODE: roomCode };
  const child = spawn(
    "npx",
    ["artillery", "run", scenarioPath, ...artilleryArgs],
    {
      stdio: "inherit",
      env,
    }
  );

  child.on("close", (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
