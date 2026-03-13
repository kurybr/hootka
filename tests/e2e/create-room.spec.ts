import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("Create room flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("navigates from header to host page", async ({ page }) => {
    await page.getByRole("link", { name: "Criar sala" }).click();

    await expect(page).toHaveURL(/\/host/);
    await expect(page.getByRole("heading", { name: "Biblioteca de Quizzes" })).toBeVisible();
  });

  test("navigates from host to create room page", async ({ page }) => {
    await page.goto(`${BASE_URL}/host`);

    await page.getByRole("link", { name: "Criar Novo Quiz" }).first().click();

    await expect(page).toHaveURL(/\/host\/create/);
    await expect(page.getByRole("heading", { name: "Criar Sala" })).toBeVisible();
    await expect(page.getByText("Adicione as perguntas do quiz")).toBeVisible();
  });

  test("shows validation error when creating room with empty question", async ({ page }) => {
    await page.goto(`${BASE_URL}/host/create`);

    await page.getByRole("button", { name: "Criar Sala" }).click();

    await expect(page.getByText(/enunciado é obrigatório/)).toBeVisible();
  });

  test("shows validation error when question has empty options", async ({ page }) => {
    await page.goto(`${BASE_URL}/host/create`);

    await page.getByPlaceholder("Digite a pergunta...").fill("Qual a capital do Brasil?");
    await page.getByRole("button", { name: "Criar Sala" }).click();

    await expect(page.getByText(/preencha todas as alternativas/)).toBeVisible();
  });

  test("fills question and options correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/host/create`);

    await page.getByPlaceholder("Digite a pergunta...").fill("Qual a capital do Brasil?");
    const optionInputs = page.getByPlaceholder(/Alternativa \d/);
    const count = await optionInputs.count();
    for (let i = 0; i < count; i++) {
      await optionInputs.nth(i).fill(`Opção ${i + 1}`);
    }

    await expect(page.getByPlaceholder("Digite a pergunta...")).toHaveValue("Qual a capital do Brasil?");
  });

  test("can add multiple questions", async ({ page }) => {
    await page.goto(`${BASE_URL}/host/create`);

    await page.getByRole("button", { name: "+ Adicionar Pergunta" }).click();

    await expect(page.getByRole("heading", { name: "Pergunta 2" })).toBeVisible();
  });

  test("save to library checkbox shows title input when checked", async ({ page }) => {
    await page.goto(`${BASE_URL}/host/create`);

    await page.getByText("Salvar quiz na biblioteca ao criar sala").click();

    await expect(page.getByLabel("Título do quiz")).toBeVisible();
    await expect(page.getByPlaceholder("Ex: Conhecimentos Gerais")).toBeVisible();
  });

  test("back button returns to host page", async ({ page }) => {
    await page.goto(`${BASE_URL}/host/create`);

    await page.getByRole("link", { name: "Voltar" }).click();

    await expect(page).toHaveURL(/\/host/);
    await expect(page.getByRole("heading", { name: "Biblioteca de Quizzes" })).toBeVisible();
  });

  test("creates room successfully with valid quiz", async ({ page }) => {
    await page.goto(`${BASE_URL}/host/create`);

    await page.getByPlaceholder("Digite a pergunta...").fill("1+1=?");
    const optionInputs = page.getByPlaceholder(/Alternativa \d/);
    const count = await optionInputs.count();
    for (let i = 0; i < count; i++) {
      await optionInputs.nth(i).fill(`${i + 1}`);
    }

    await page.getByRole("button", { name: "Criar Sala" }).click();

    await expect(page).toHaveURL(/\/host\/[a-zA-Z0-9-]+/, { timeout: 15000 });
  });
});
