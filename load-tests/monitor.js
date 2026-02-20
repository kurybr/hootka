#!/usr/bin/env node
/**
 * Coleta métricas do servidor durante os testes de carga.
 * Faz polling em /api/metrics e grava em arquivo ou stdout.
 *
 * Uso: node load-tests/monitor.js [intervalo_ms] [duracao_s]
 * Ex: node load-tests/monitor.js 1000 60  # a cada 1s, por 60s
 * Ex: node load-tests/monitor.js 500      # a cada 0.5s, até Ctrl+C
 *
 * Variáveis de ambiente:
 *   TARGET - URL base (default: http://localhost:3000)
 *   OUTPUT - arquivo para gravar JSON (default: stdout)
 */

const TARGET = process.env.TARGET || "http://localhost:3000";
const intervalMs = parseInt(process.argv[2] || "1000", 10);
const durationSec = process.argv[3] ? parseInt(process.argv[3], 10) : null;
const outputFile = process.env.OUTPUT || null;

const results = [];

async function fetchMetrics() {
  try {
    const res = await fetch(`${TARGET}/api/metrics`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}

async function collect() {
  const data = await fetchMetrics();
  if (data) {
    results.push(data);
    if (outputFile) {
      const fs = await import("fs");
      fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    } else {
      console.log(JSON.stringify(data));
    }
  }
}

async function run() {
  const id = setInterval(collect, intervalMs);
  await collect();

  if (durationSec) {
    setTimeout(() => {
      clearInterval(id);
      if (outputFile) {
        console.error(`Métricas salvas em ${outputFile} (${results.length} amostras)`);
      }
      process.exit(0);
    }, durationSec * 1000);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
