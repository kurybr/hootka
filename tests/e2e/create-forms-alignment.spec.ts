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
    const submit = [...main.querySelectorAll("button")].find((button) =>
      /Criar Sala|Criar quiz global/.test(button.textContent ?? "")
    );

    return {
      h1: h1?.textContent?.trim() ?? null,
      h1Class: h1?.className ?? null,
      containerClass: main.querySelector(":scope > div")?.className ?? null,
      sectionTitles,
      submitFullWidth: submit?.className.includes("w-full") ?? false,
      hasAiSection: sectionTitles.some((title) => title.includes("Gerar quiz com IA")),
      hasDataCard: sectionTitles.some((title) =>
        /Dados da sala|Dados do quiz/.test(title ?? "")
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
    expect(audit?.sectionTitles?.indexOf("Gerar quiz com IA")).toBeLessThan(
      audit?.sectionTitles?.indexOf("Dados da sala") ?? -1
    );
    expect(audit?.sectionTitles?.indexOf("Dados da sala")).toBeLessThan(
      audit?.sectionTitles?.findIndex((title) => title.startsWith("Pergunta")) ?? -1
    );
    await expect(page.getByLabel("O que você quer neste quiz?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Gerar quiz completo" })).toBeVisible();
  });

  test("global create login gate uses shared shell heading", async ({ page }) => {
    await page.goto(GLOBAL_CREATE);
    await dismissCookies(page);

    await expect(page.getByRole("heading", { name: "Novo quiz global" })).toBeVisible();
    await expect(
      page.getByText("Publique um quiz comunitário com ranking global.")
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Entre com Google para criar um quiz" })
    ).toBeVisible();
  });
});
