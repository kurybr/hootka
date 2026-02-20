#!/usr/bin/env node
/**
 * Cria uma sala seed e executa o teste de carga com o código obtido.
 * Para cenários Playwright: usa seed-quiz-playwright.js (host cria sala via UI, extrai código da tela)
 * Para cenários Socket.IO: usa seed-quiz.js (cria sala via Socket.IO)
 *
 * Uso: node load-tests/run-with-seed.js [cenário] [opções artillery]
 * Ex: node load-tests/run-with-seed.js join-and-play
 * Ex: node load-tests/run-with-seed.js playwright-join
 */

const { spawn } = require("child_process");
const path = require("path");

const PLAYWRIGHT_SCENARIOS = ["playwright-join", "playwright-join-headed", "playwright-join-chrome"];

function getSeedScript(scenario) {
  return PLAYWRIGHT_SCENARIOS.includes(scenario)
    ? "seed-quiz-playwright.js"
    : "seed-quiz.js";
}

async function createSeed(scenario) {
  const seedScript = getSeedScript(scenario);
  return new Promise((resolve, reject) => {
    const child = spawn("node", [path.join(__dirname, seedScript)], {
      stdio: ["inherit", "pipe", "inherit"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`Falha ao criar sala seed (${seedScript})`));
      try {
        const data = JSON.parse(output.trim());
        resolve(data.code);
      } catch {
        reject(new Error(`Resposta inválida do ${seedScript}`));
      }
    });
  });
}

async function main() {
  const scenario = process.argv[2] || "join-and-play";
  const artilleryArgs = process.argv.slice(3);
  const scenarioPath = path.join(__dirname, "scenarios", `${scenario}.yml`);
  const seedScript = getSeedScript(scenario);

  console.log(`Criando sala seed (${seedScript})...`);
  const roomCode = await createSeed(scenario);
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
