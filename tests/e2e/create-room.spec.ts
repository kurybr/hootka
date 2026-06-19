import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

async function dismissCookies(page: import("@playwright/test").Page) {
  const accept = page.getByRole("button", { name: "Aceitar" });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
}

async function gotoCreateRoom(page: import("@playwright/test").Page) {
  await page.goto(`${BASE_URL}/host/create`);
  await dismissCookies(page);
}

test.describe("Create room flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await dismissCookies(page);
  });

  test("navigates from header to host page", async ({ page }) => {
    await page.getByRole("link", { name: "Criar sala" }).click();

    await expect(page).toHaveURL(/\/host/);
    await expect(page.getByRole("heading", { name: "Minhas salas" })).toBeVisible();
  });

  test("navigates from host to create room page", async ({ page }) => {
    await page.goto(`${BASE_URL}/host`);

    await page.getByRole("link", { name: "Criar nova sala" }).first().click();

    await expect(page).toHaveURL(/\/host\/create/);
    await expect(page.getByRole("heading", { name: "Criar Sala" })).toBeVisible();
    await expect(page.getByText(/sala ao vivo/i)).toBeVisible();
    await expect(page.getByText("Gerar sala com IA")).toBeVisible();
    await expect(page.getByText("Dados da sala")).toBeVisible();
  });

  test("shows validation error when creating room with empty question", async ({ page }) => {
    await gotoCreateRoom(page);

    await page.getByRole("button", { name: "Criar Sala" }).click();

    await expect(page.getByText(/enunciado é obrigatório/)).toBeVisible();
  });

  test("shows validation error when question has empty options", async ({ page }) => {
    await gotoCreateRoom(page);

    await page.getByPlaceholder("Digite a pergunta...").first().fill("Qual a capital do Brasil?");
    await page.getByRole("button", { name: "Criar Sala" }).click();

    await expect(page.getByText(/preencha todas as alternativas/)).toBeVisible();
  });

  test("fills question and options correctly", async ({ page }) => {
    await gotoCreateRoom(page);

    const questionInput = page.getByPlaceholder("Digite a pergunta...").first();
    await questionInput.fill("Qual a capital do Brasil?");
    const optionInputs = page.getByPlaceholder(/Alternativa \d/);
    const count = await optionInputs.count();
    for (let i = 0; i < count; i++) {
      await optionInputs.nth(i).fill(`Opção ${i + 1}`);
    }

    await expect(questionInput).toHaveValue("Qual a capital do Brasil?");
  });

  test("can add multiple questions", async ({ page }) => {
    await gotoCreateRoom(page);

    await page.getByRole("button", { name: "+ Adicionar Pergunta" }).click();

    await expect(page.getByText("Pergunta 2")).toBeVisible();
  });

  test("palette picker is visible and selectable", async ({ page }) => {
    await gotoCreateRoom(page);

    await expect(page.getByText("Cores das alternativas", { exact: true })).toBeVisible();
    const brasilPalette = page.getByRole("radio", {
      name: /Brasil.*bandeira brasileira/i,
    });
    await brasilPalette.check({ force: true });
    await expect(brasilPalette).toBeChecked();
  });

  test("save to library checkbox is visible with title field", async ({ page }) => {
    await gotoCreateRoom(page);

    await expect(page.getByLabel("Título da sala")).toBeVisible();
    await expect(page.getByText("Salvar em Minhas salas ao criar")).toBeVisible();
  });

  test("back button returns to host page", async ({ page }) => {
    await gotoCreateRoom(page);

    await page.getByRole("link", { name: "Voltar" }).click();

    await expect(page).toHaveURL(/\/host/);
    await expect(page.getByRole("heading", { name: "Minhas salas" })).toBeVisible();
  });

  test("creates room successfully with valid quiz", async ({ page }) => {
    await gotoCreateRoom(page);

    await page.getByPlaceholder("Digite a pergunta...").first().fill("1+1=?");
    const optionInputs = page.getByPlaceholder(/Alternativa \d/);
    const count = await optionInputs.count();
    for (let i = 0; i < count; i++) {
      await optionInputs.nth(i).fill(`${i + 1}`);
    }

    await page.getByRole("button", { name: "Criar Sala" }).click();

    await expect(page).toHaveURL(/\/host\/[a-zA-Z0-9-]+/, { timeout: 15000 });
  });
});
