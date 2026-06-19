import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("Join room flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("navigates from home to join page via room code", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Aprenda, ensine e se divirta.",
      })
    ).toBeVisible();

    await page.getByRole("navigation", { name: "Ações principais" }).getByRole("link", { name: "Ir para uma sala" }).click();

    await expect(page).toHaveURL(/\/join$/);
    await expect(page.getByRole("heading", { name: "Entrar em Sala" })).toBeVisible();

    await page.getByLabel("Código da sala").fill("ABC123");

    await expect(page.getByLabel("Código da sala")).toHaveValue("A B C 1 2 3");
  });

  test("shows error when submitting empty form", async ({ page }) => {
    await page.goto(`${BASE_URL}/join`);

    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("Informe o código da sala")).toBeVisible();
  });

  test("shows error when code has wrong length", async ({ page }) => {
    await page.goto(`${BASE_URL}/join`);

    await page.getByPlaceholder("A B C 1 2 3").fill("ABC");
    await page.getByPlaceholder("Como deseja ser chamado").fill("João");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("O código deve ter exatamente 6 caracteres")).toBeVisible();
  });

  test("shows error when code has invalid characters", async ({ page }) => {
    await page.goto(`${BASE_URL}/join`);

    await page.getByPlaceholder("A B C 1 2 3").fill("ABC!@#");
    await page.getByPlaceholder("Como deseja ser chamado").fill("João");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("O código deve conter apenas letras e números")).toBeVisible();
  });

  test("shows error when name is empty", async ({ page }) => {
    await page.goto(`${BASE_URL}/join`);

    await page.getByPlaceholder("A B C 1 2 3").fill("ABC123");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("Informe seu nome")).toBeVisible();
  });

  test("shows error when name is too short", async ({ page }) => {
    await page.goto(`${BASE_URL}/join`);

    await page.getByPlaceholder("A B C 1 2 3").fill("ABC123");
    await page.getByPlaceholder("Como deseja ser chamado").fill("J");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("O nome deve ter pelo menos 2 caracteres")).toBeVisible();
  });

  test("shows error when name is too long", async ({ page }) => {
    await page.goto(`${BASE_URL}/join`);

    await page.getByPlaceholder("A B C 1 2 3").fill("ABC123");
    await page.getByPlaceholder("Como deseja ser chamado").fill("A".repeat(31));
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("O nome deve ter no máximo 30 caracteres")).toBeVisible();
  });

  test("back button returns to home", async ({ page }) => {
    await page.goto(`${BASE_URL}/join`);

    await page.getByRole("link", { name: "Voltar" }).click();

    await expect(page).toHaveURL(BASE_URL + "/");
    await expect(
      page.getByRole("heading", {
        name: "Aprenda, ensine e se divirta.",
      })
    ).toBeVisible();
  });

  test("form displays code with spaces for readability", async ({ page }) => {
    await page.goto(`${BASE_URL}/join`);

    await page.getByPlaceholder("A B C 1 2 3").fill("ABC123");

    const codeInput = page.getByPlaceholder("A B C 1 2 3");
    await expect(codeInput).toHaveValue("A B C 1 2 3");
  });
});
