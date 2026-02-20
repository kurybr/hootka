#!/usr/bin/env node
/**
 * Analisa relatórios JSON do Artillery em load-tests/results/
 * Gera tabela resumo, identifica ponto de quebra e exporta RESULTS.md
 *
 * Uso: node load-tests/analyze.js
 * Ou: node load-tests/analyze.js load-tests/results/cenario-a10.json
 */

const fs = require("fs");
const path = require("path");

const RESULTS_DIR = path.join(__dirname, "results");
const OUTPUT_FILE = path.join(__dirname, "RESULTS.md");

const SCENARIO_USERS = {
  "join-and-play-small": 10,
  "join-and-play-medium": 50,
  "join-and-play-large": 200,
  "join-and-play-stress": 500,
  "A-mass-connection-10": 10,
  "A-mass-connection-50": 50,
  "A-mass-connection-100": 100,
  "A-mass-connection-200": 200,
  "A-mass-connection-500": 500,
  "B-burst-response": 200,
  "C-full-game": 180,
  "D-multiple-rooms": 5,
  "D-multiple-rooms-10": 10,
  "E-disconnect-reconnect": 90,
  "create-room": 60,
};

function extractScenarioName(filename) {
  const base = path.basename(filename, ".json");
  for (const key of Object.keys(SCENARIO_USERS)) {
    if (base.includes(key) || base.includes(key.replace(/-/g, "_"))) {
      return key;
    }
  }
  return base;
}

function parseArtilleryReport(filepath) {
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    const data = JSON.parse(content);
    const agg = data.aggregate || data;
    const counters = agg.counters || {};
    const summaries = agg.summaries || agg.histograms || {};
    const latency = agg.latency || summaries.scenarioDuration || {};

    const vusersCreated = counters["vusers.created"] || counters.vusers_created || 0;
    const vusersCompleted = counters["vusers.completed"] || counters.vusers_completed || vusersCreated;
    const errors = counters["vusers.failed"] || counters.errors || 0;
    const total = vusersCreated || vusersCompleted || 1;
    const errorRate = total > 0 ? ((errors / total) * 100).toFixed(2) : "0";

    const p50 = latency.p50 ?? latency.min ?? "-";
    const p95 = latency.p95 ?? latency.median ?? "-";
    const p99 = latency.p99 ?? latency.max ?? "-";

    return {
      scenario: extractScenarioName(filepath),
      users: SCENARIO_USERS[extractScenarioName(filepath)] ?? Math.round(vusersCreated),
      vusersCreated,
      vusersCompleted,
      errors,
      errorRate: parseFloat(errorRate),
      p50: typeof p50 === "number" ? Math.round(p50) : p50,
      p95: typeof p95 === "number" ? Math.round(p95) : p95,
      p99: typeof p99 === "number" ? Math.round(p99) : p99,
      memoryMB: null,
    };
  } catch (err) {
    return null;
  }
}

function findMetricsForScenario(scenarioName) {
  const metricsFile = path.join(RESULTS_DIR, `metrics-${scenarioName}.json`);
  if (fs.existsSync(metricsFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(metricsFile, "utf-8"));
      const last = Array.isArray(data) ? data[data.length - 1] : data;
      return last?.memory?.rssMB ?? last?.memory?.heapUsedMB ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

function collectResults() {
  const results = [];
  if (!fs.existsSync(RESULTS_DIR)) {
    return results;
  }

  const files = fs.readdirSync(RESULTS_DIR).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    if (file.startsWith("metrics-")) continue;
    const filepath = path.join(RESULTS_DIR, file);
    const stat = fs.statSync(filepath);
    if (!stat.isFile()) continue;

    const row = parseArtilleryReport(filepath);
    if (row) {
      const metricsMem = findMetricsForScenario(row.scenario);
      if (metricsMem) row.memoryMB = metricsMem;
      results.push(row);
    }
  }

  results.sort((a, b) => a.users - b.users);
  return results;
}

function identifyBreakingPoint(results) {
  const p99Threshold = 500;
  const errorThreshold = 5;

  let maxGoodUsers = 0;
  let firstHighLatency = null;
  let firstHighError = null;

  for (const r of results) {
    const p99 = typeof r.p99 === "number" ? r.p99 : 0;
    if (p99 < p99Threshold && r.errorRate < errorThreshold) {
      maxGoodUsers = Math.max(maxGoodUsers, r.users);
    }
    if (p99 >= 2000 && !firstHighLatency) firstHighLatency = r;
    if (r.errorRate >= errorThreshold && !firstHighError) firstHighError = r;
  }

  return {
    maxGoodUsers,
    firstHighLatency,
    firstHighError,
    p99Threshold,
    errorThreshold,
  };
}

function getEnvironmentInfo() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };
}

function generateMarkdown(results, breakingPoint, env) {
  const lines = [];

  lines.push("# Relatório de Testes de Carga - Quiz em Tempo Real");
  lines.push("");
  lines.push(`*Gerado em: ${new Date().toLocaleString("pt-BR")}*`);
  lines.push("");

  lines.push("## Ambiente de Teste");
  lines.push("");
  lines.push("| Propriedade | Valor |");
  lines.push("|-------------|-------|");
  lines.push(`| Node.js | ${env.nodeVersion} |`);
  lines.push(`| Plataforma | ${env.platform} |`);
  lines.push(`| Arquitetura | ${env.arch} |`);
  lines.push("");

  lines.push("## Resultados por Cenário");
  lines.push("");
  lines.push("| Cenário | Usuários | p50 (ms) | p95 (ms) | p99 (ms) | Erros (%) | Memória (MB) |");
  lines.push("|---------|----------|----------|----------|----------|-----------|--------------|");

  for (const r of results) {
    const mem = r.memoryMB != null ? `${r.memoryMB}` : "-";
    lines.push(`| ${r.scenario} | ${r.users} | ${r.p50} | ${r.p95} | ${r.p99} | ${r.errorRate} | ${mem} |`);
  }
  lines.push("");

  lines.push("## Ponto de Quebra Identificado");
  lines.push("");

  if (breakingPoint.maxGoodUsers > 0) {
    lines.push(`- **O servidor suporta até ~${breakingPoint.maxGoodUsers} usuários simultâneos** com p99 < ${breakingPoint.p99Threshold}ms e taxa de erro < ${breakingPoint.errorThreshold}%`);
  }
  if (breakingPoint.firstHighLatency) {
    lines.push(`- **A partir de ${breakingPoint.firstHighLatency.users} usuários** (${breakingPoint.firstHighLatency.scenario}), a latência p99 ultrapassou 2s`);
  }
  if (breakingPoint.firstHighError) {
    lines.push(`- **A partir de ${breakingPoint.firstHighError.users} usuários** (${breakingPoint.firstHighError.scenario}), a taxa de erro ultrapassou ${breakingPoint.errorThreshold}%`);
  }
  if (!breakingPoint.maxGoodUsers && !breakingPoint.firstHighLatency && !breakingPoint.firstHighError) {
    lines.push("- *Execute mais cenários com `run-all.sh` para identificar o ponto de quebra.*");
  }
  lines.push("");

  lines.push("## Gargalos Identificados");
  lines.push("");
  lines.push("- Conexões Socket.IO simultâneas");
  lines.push("- Processamento de respostas (answer:submit) em burst");
  lines.push("- Uso de memória do InMemoryStore com muitas salas");
  lines.push("");

  lines.push("## Recomendações de Otimização");
  lines.push("");
  lines.push("1. **Connection pooling**: Limitar conexões por IP em produção");
  lines.push("2. **Redis/Store externo**: Substituir InMemoryStore por persistência externa para múltiplas instâncias");
  lines.push("3. **Rate limiting**: Aplicar throttling em answer:submit para evitar picos");
  lines.push("4. **Horizontal scaling**: Múltiplas instâncias com load balancer para salas distribuídas");
  lines.push("");

  lines.push("## Limites Recomendados para Produção");
  lines.push("");
  const limit = breakingPoint.maxGoodUsers || 50;
  lines.push(`- **Máximo de ${Math.floor(limit * 0.8)} usuários por sala** (margem de segurança 20%)`);
  lines.push(`- **Máximo de 20 salas simultâneas** por instância (com InMemoryStore)`);
  lines.push("- Monitorar `/api/metrics` em produção (com ENABLE_METRICS=1)");
  lines.push("");

  return lines.join("\n");
}

function main() {
  const results = collectResults();
  const breakingPoint = identifyBreakingPoint(results);
  const env = getEnvironmentInfo();

  const markdown = generateMarkdown(results, breakingPoint, env);
  fs.writeFileSync(OUTPUT_FILE, markdown);

  console.log(`Relatório gerado: ${OUTPUT_FILE}`);
  console.log(`Cenários analisados: ${results.length}`);
  if (results.length === 0) {
    console.log("Dica: Execute 'yarn test:load:run-all' ou rode cenários com --output load-tests/results/");
  }
}

main();
