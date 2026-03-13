import { test, expect, type Page } from "@playwright/test";

async function dismissCookieBanner(p: Page) {
  const btn = p.getByRole("button", { name: /Aceitar|Recusar/ });
  if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await btn.click({ force: true });
  }
}

test.describe("Live room - host and participant flow", () => {
  test("host creates room, participant joins, game runs to completion", async ({
    page,
    context,
  }) => {
    const browser = context.browser();
    if (!browser) throw new Error("Browser não disponível");

    const participantContext = await browser.newContext({
      baseURL: "http://localhost:3000",
    });
    const participantPage = await participantContext.newPage();

    try {
      // --- Host: criar sala ---
      await page.goto("/host/create");
      await dismissCookieBanner(page);
      await page.getByPlaceholder("Digite a pergunta...").first().fill("1+1=?");
      const optionInputs = page.getByPlaceholder(/Alternativa \d/);
      const count = await optionInputs.count();
      for (let i = 0; i < count; i++) {
        await optionInputs.nth(i).fill(`${i + 1}`);
      }
      await page.getByRole("button", { name: "Criar Sala" }).click({ force: true });

      await expect(page).toHaveURL(/\/host\/[a-zA-Z0-9-]+/, { timeout: 15000 });
      await dismissCookieBanner(page);

      // --- Extrair código da sala (span com 6 caracteres, não o contador de participantes) ---
      const codeElement = page
        .getByRole("main")
        .locator("span.font-mono.text-5xl, span.font-mono.text-6xl")
        .first();
      await expect(codeElement).not.toHaveText("---", { timeout: 5000 });
      const roomCode = (await codeElement.textContent())?.replace(/\s/g, "").toUpperCase() ?? "";
      expect(roomCode.length).toBe(6);

      // --- Participante: entrar na sala ---
      await participantPage.goto("/join");
      await dismissCookieBanner(participantPage);
      await participantPage.getByPlaceholder("A B C 1 2 3").pressSequentially(roomCode);
      await participantPage
        .getByPlaceholder("Como deseja ser chamado")
        .fill("Jogador E2E");
      await participantPage.getByRole("button", { name: "Entrar" }).click();

      await expect(participantPage).toHaveURL(/\/play\/[a-zA-Z0-9-]+/, {
        timeout: 10000,
      });

      // --- Host: ver participante e iniciar jogo (aguardar sync) ---
      await expect(
        page.getByText("Jogador E2E", { exact: false })
      ).toBeVisible({ timeout: 10000 });
      await page.getByRole("button", { name: /Iniciar jogo|Iniciar/i }).click({ force: true });

      // --- Participante: responder pergunta ---
      await expect(
        participantPage.getByText("1+1=?")
      ).toBeVisible({ timeout: 15000 });
      await participantPage.getByRole("button", { name: "2" }).click();

      // --- Aguardar resultado/ranking ---
      await expect(
        participantPage.getByText(/pontos|ranking|resultado/i)
      ).toBeVisible({ timeout: 15000 });

      // --- Host: encerrar (ou aguardar auto-avanço se só 1 pergunta) ---
      const endButton = page.getByRole("button", { name: /Encerrar|Finalizar/i });
      if (await endButton.isVisible({ timeout: 5000 })) {
        await endButton.click({ force: true });
      }

      await expect(
        page.getByText(/encerrada|finalizado|ranking final/i)
      ).toBeVisible({ timeout: 10000 });
    } finally {
      await participantContext.close();
    }
  });

  test("participant sees error when entering invalid room code", async ({
    page,
  }) => {
    await page.goto("/join");
    await page.getByPlaceholder("A B C 1 2 3").fill("XXXXXX");
    await page.getByPlaceholder("Como deseja ser chamado").fill("Teste");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(
      page.getByRole("main").getByText(/sala não encontrada|não encontrada/i)
    ).toBeVisible({ timeout: 5000 });
  });
});
