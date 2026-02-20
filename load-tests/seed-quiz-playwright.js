#!/usr/bin/env node
/**
 * Cria uma sala via UI (Playwright) como o host faria.
 * Navega até /host/create, preenche um quiz mínimo, cria a sala e extrai o código da tela.
 *
 * Uso: node load-tests/seed-quiz-playwright.js
 * Requer: servidor rodando (yarn dev), Playwright instalado
 *
 * Saída: JSON com { roomId, code }
 */

const { chromium } = require("playwright");

const TARGET = process.env.TARGET || "http://localhost:3000";

/** Fecha o banner de cookies se estiver visível (não bloqueia cliques no conteúdo) */
async function dismissCookieBanner(page) {
  const acceptBtn = page.getByRole("button", { name: "Aceitar" });
  try {
    await acceptBtn.waitFor({ state: "visible", timeout: 3000 });
    await acceptBtn.click();
    await new Promise((r) => setTimeout(r, 400));
  } catch {
    // Banner não apareceu ou já foi fechado
  }
}

async function createRoomViaUI() {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== "false",
    // Usa Chrome do sistema por padrão (evita precisar de playwright install)
    channel: process.env.USE_CHROMIUM === "true" ? undefined : "chrome",
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Definir consentimento no localStorage antes de carregar (evita banner bloquear cliques)
    await page.addInitScript(() => {
      window.localStorage.setItem("hootka_analytics_consent", "accepted");
    });

    await page.goto(TARGET);
    await page.waitForLoadState("domcontentloaded");
    await dismissCookieBanner(page);

    // Ir para criar sala (direto para o formulário)
    await page.goto(`${TARGET}/host/create`);
    await page.waitForLoadState("domcontentloaded");

    // Preencher pergunta mínima (primeira pergunta do formulário)
    await page.getByPlaceholder("Digite a pergunta...").first().fill("P1?");
    await page.getByPlaceholder("Alternativa 1").fill("A");
    await page.getByPlaceholder("Alternativa 2").fill("B");
    await page.getByPlaceholder("Alternativa 3").fill("C");
    await page.getByPlaceholder("Alternativa 4").fill("D");

    await dismissCookieBanner(page);

    // Criar sala
    await page.getByRole("button", { name: "Criar Sala" }).click();

    // Aguardar redirect para /host/[roomId]
    await page.waitForURL(/\/host\/[a-zA-Z0-9-]+/, { timeout: 15000 });

    const roomId = page.url().split("/host/")[1]?.split("?")[0];
    if (!roomId) throw new Error("Não foi possível obter roomId da URL");

    // Extrair código da tela (span com font-mono que contém o código)
    const codeEl = page.locator('span.font-mono').filter({ hasText: /^[A-Z0-9]{6}$/ }).first();
    await codeEl.waitFor({ state: "visible", timeout: 5000 });
    const code = (await codeEl.textContent())?.trim().replace(/\s/g, "") || null;

    if (!code || code.length !== 6) {
      throw new Error(`Código inválido extraído da tela: ${code}`);
    }

    return { roomId, code };
  } finally {
    await browser.close();
  }
}

createRoomViaUI()
  .then(({ roomId, code }) => {
    console.log(JSON.stringify({ roomId, code }));
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
