import { test, expect } from "@playwright/test";

const LIVE_CREATE = "/host/create";
const GLOBAL_CREATE = "/community/quizzes/create";

async function dismissCookies(page: import("@playwright/test").Page) {
  const accept = page.getByRole("button", { name: "Aceitar" });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
}

async function readCreateFormAudit(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const main = document.querySelector("main");
    if (!main) return null;

    const h1 = main.querySelector("h1");
    const sectionTitles = [...main.querySelectorAll(".font-semibold.leading-none, .text-lg.font-semibold")]
      .map((el) => el.textContent?.trim())
      .filter((title): title is string => Boolean(title));
    const mainText = main.textContent ?? "";
    const submit = [...main.querySelectorAll("button")].find((button) =>
      /Criar Sala|Criar desafio/.test(button.textContent ?? "")
    );

    return {
      h1: h1?.textContent?.trim() ?? null,
      h1Class: h1?.className ?? null,
      containerClass: main.querySelector(":scope > div")?.className ?? null,
      sectionTitles,
      submitFullWidth: submit?.className.includes("w-full") ?? false,
      hasAiSection:
        sectionTitles.some((title) =>
          /Gerar sala com IA|Gerar desafio com IA|Gerar quiz com IA/.test(title ?? "")
        ) ||
        /Gerar sala com IA|Gerar desafio com IA|Gerar quiz com IA/.test(mainText),
      hasDataCard: sectionTitles.some((title) =>
        title === "Dados da sala"
      ),
      hasQuestionCard: sectionTitles.some((title) => title?.startsWith("Pergunta")),
    };
  });
}

test.describe("Create forms visual alignment", () => {
  test("live create uses shared shell and section order", async ({ page }) => {
    await page.goto(LIVE_CREATE);
    await dismissCookies(page);

    const audit = await readCreateFormAudit(page);
    expect(audit).not.toBeNull();
    expect(audit?.h1).toBe("Criar Sala");
    expect(audit?.h1Class).toContain("text-3xl");
    expect(audit?.h1Class).toContain("font-heading");
    expect(audit?.containerClass).toContain("max-w-5xl");
    expect(audit?.hasAiSection).toBe(true);
    expect(audit?.hasDataCard).toBe(true);
    expect(audit?.hasQuestionCard).toBe(true);
    expect(audit?.submitFullWidth).toBe(true);
    const aiSectionIndex = audit?.sectionTitles?.findIndex((title) =>
      /Gerar sala com IA|Gerar desafio com IA|Gerar quiz com IA/.test(title ?? "")
    );
    if (aiSectionIndex !== undefined && aiSectionIndex >= 0) {
      expect(aiSectionIndex).toBeLessThan(
        audit?.sectionTitles?.indexOf("Dados da sala") ?? -1
      );
    }
    expect(audit?.sectionTitles?.indexOf("Dados da sala")).toBeLessThan(
      audit?.sectionTitles?.findIndex((title) => title.startsWith("Pergunta")) ?? -1
    );
    await expect(page.getByText(/Gerar sala com IA|Gerar desafio com IA|Gerar quiz com IA/)).toBeVisible();
    const livePrompt = page.getByLabel("O que você quer nesta sala?");
    const globalPrompt = page.getByLabel("O que você quer neste desafio?");
    const legacyGlobalPrompt = page.getByLabel("O que você quer neste quiz?");
    if (await livePrompt.isVisible().catch(() => false)) {
      await expect(page.getByRole("button", { name: "Gerar sala completa" })).toBeVisible();
    } else if (await globalPrompt.isVisible().catch(() => false)) {
      await expect(page.getByRole("button", { name: "Gerar desafio completo" })).toBeVisible();
    } else if (await legacyGlobalPrompt.isVisible().catch(() => false)) {
      await expect(page.getByRole("button", { name: "Gerar quiz completo" })).toBeVisible();
    }
  });

  test("global create login gate uses shared shell heading", async ({ page }) => {
    await page.goto(GLOBAL_CREATE);
    await dismissCookies(page);

    await expect(page.getByRole("heading", { name: "Novo desafio" })).toBeVisible();
    await expect(
      page.getByText("Publique um desafio comunitário com ranking global.")
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar" })).toBeVisible();
    await expect(
      page.getByText("Entre com Google para criar um desafio")
    ).toBeVisible();
  });
});
