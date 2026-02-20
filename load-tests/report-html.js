#!/usr/bin/env node
/**
 * Gera relatório HTML a partir dos JSON do Artillery (para visualizar no navegador).
 * Substitui o antigo "artillery report" (removido na v2.0.22).
 *
 * Uso:
 *   node load-tests/report-html.js                    # todos os JSON em load-tests/results/
 *   node load-tests/report-html.js results/run.json   # um arquivo
 *   node load-tests/report-html.js -o relatorio.html  # nome do HTML de saída
 *
 * Abre o HTML no navegador (se possível) ou imprime o caminho do arquivo.
 */

const fs = require("fs");
const path = require("path");

const RESULTS_DIR = path.join(__dirname, "results");
const DEFAULT_HTML = path.join(__dirname, "results", "report.html");

function parseArtilleryReport(content) {
  try {
    const data = typeof content === "string" ? JSON.parse(content) : content;
    const agg = data.aggregate || data;
    const counters = agg.counters || {};
    const summaries = agg.summaries || agg.histograms || {};
    const latency = summaries.scenarioDuration || summaries["vusers.session_length"] || agg.latency || {};

    const vusersCreated = counters["vusers.created"] || counters.vusers_created || 0;
    const vusersCompleted = counters["vusers.completed"] || counters.vusers_completed || vusersCreated;
    const errors = counters["vusers.failed"] || counters.errors || 0;
    const total = vusersCreated || vusersCompleted || 1;
    const errorRate = total > 0 ? ((errors / total) * 100).toFixed(2) : "0";

    const p50 = latency.p50 ?? latency.median ?? latency.min ?? "-";
    const p95 = latency.p95 ?? "-";
    const p99 = latency.p99 ?? latency.max ?? "-";

    return {
      vusersCreated,
      vusersCompleted,
      errors,
      errorRate: parseFloat(errorRate),
      p50: typeof p50 === "number" ? Math.round(p50) : p50,
      p95: typeof p95 === "number" ? Math.round(p95) : p95,
      p99: typeof p99 === "number" ? Math.round(p99) : p99,
      raw: data,
    };
  } catch {
    return null;
  }
}

function collectReports(inputPath) {
  const reports = [];

  if (inputPath) {
    const abspath = path.isAbsolute(inputPath) ? inputPath : path.join(process.cwd(), inputPath);
    if (fs.existsSync(abspath) && fs.statSync(abspath).isFile()) {
      const content = fs.readFileSync(abspath, "utf-8");
      const parsed = parseArtilleryReport(content);
      if (parsed) {
        reports.push({
          name: path.basename(abspath, ".json"),
          file: abspath,
          ...parsed,
        });
      }
    }
  } else {
    if (!fs.existsSync(RESULTS_DIR)) return reports;
    const files = fs.readdirSync(RESULTS_DIR).filter((f) => f.endsWith(".json") && !f.startsWith("metrics-"));
    for (const file of files) {
      const filepath = path.join(RESULTS_DIR, file);
      const content = fs.readFileSync(filepath, "utf-8");
      const parsed = parseArtilleryReport(content);
      if (parsed) {
        reports.push({
          name: path.basename(file, ".json"),
          file: filepath,
          ...parsed,
        });
      }
    }
  }

  return reports;
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(reports, outPath) {
  const rows = reports
    .map(
      (r) =>
        `<tr>
          <td>${escapeHtml(r.name)}</td>
          <td>${r.vusersCreated}</td>
          <td>${r.vusersCompleted}</td>
          <td>${r.errors}</td>
          <td>${r.errorRate}%</td>
          <td>${r.p50}</td>
          <td>${r.p95}</td>
          <td>${r.p99}</td>
        </tr>`
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Relatório de Carga - Hootka</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 1.5rem; background: #0f172a; color: #e2e8f0; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .meta { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; }
    th, td { padding: 0.75rem 1rem; text-align: left; }
    th { background: #334155; font-weight: 600; }
    tr:nth-child(even) { background: #1e293b; }
    tr:hover { background: #334155; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .error { color: #f87171; }
    .ok { color: #4ade80; }
    .foot { margin-top: 1.5rem; font-size: 0.875rem; color: #64748b; }
  </style>
</head>
<body>
  <h1>Relatório de Testes de Carga - Hootka</h1>
  <p class="meta">Gerado em ${new Date().toLocaleString("pt-BR")} · ${reports.length} cenário(s)</p>
  <table>
    <thead>
      <tr>
        <th>Cenário</th>
        <th class="num">VUs criados</th>
        <th class="num">VUs concluídos</th>
        <th class="num">Erros</th>
        <th class="num">Erro %</th>
        <th class="num">p50 (ms)</th>
        <th class="num">p95 (ms)</th>
        <th class="num">p99 (ms)</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <p class="foot">Para gerar: <code>yarn test:load:playwright -- --output load-tests/results/playwright.json</code> e depois <code>yarn test:load:report:html</code></p>
</body>
</html>`;

  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, html, "utf-8");
  return outPath;
}

function main() {
  const args = process.argv.slice(2);
  let inputPath = null;
  let outPath = DEFAULT_HTML;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-o" || args[i] === "--output") {
      outPath = args[i + 1] || DEFAULT_HTML;
      i++;
    } else if (!args[i].startsWith("-")) {
      inputPath = args[i];
    }
  }

  const reports = collectReports(inputPath);
  if (reports.length === 0) {
    console.error("Nenhum relatório JSON encontrado. Rode um teste com --output, ex.:");
    console.error("  yarn test:load:playwright -- --output load-tests/results/playwright.json");
    process.exit(1);
  }

  const written = path.isAbsolute(outPath) ? outPath : path.join(process.cwd(), outPath);
  buildHtml(reports, written);
  console.log("Relatório HTML gerado:", written);

  try {
    const { execSync } = require("child_process");
    const open = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    execSync(`${open} "${written}"`, { stdio: "ignore" });
  } catch {
    // ignore
  }
}

main();
