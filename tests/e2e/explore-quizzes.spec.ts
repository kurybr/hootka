import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("Explore quizzes flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("navigates from home to quizzes page via link", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Escolha como deseja começar.",
      })
    ).toBeVisible();

    await page.getByRole("navigation", { name: "Ações principais" }).getByRole("link", { name: /Explorar desafios/ }).click();

    await expect(page).toHaveURL(/\/quizzes/);
    await expect(page.getByRole("heading", { name: "Explorar" })).toBeVisible();
    await expect(page.getByText(/Desafios públicos/)).toBeVisible();
  });

  test("navigates from header to quizzes page", async ({ page }) => {
    await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Explorar" }).click();

    await expect(page).toHaveURL(/\/quizzes/);
    await expect(page.getByRole("heading", { name: "Explorar" })).toBeVisible();
  });

  test("shows loading or content on quizzes page", async ({ page }) => {
    await page.goto(`${BASE_URL}/quizzes`);

    await expect(
      page.getByRole("heading", { name: "Explorar" })
    ).toBeVisible({ timeout: 10000 });

    const hasContent =
      (await page.getByText("Carregando desafios...").isVisible()) ||
      (await page.getByText("Nenhum desafio disponível no momento.").isVisible()) ||
      (await page.getByRole("heading", { name: "Desafios oficiais" }).isVisible()) ||
      (await page.getByRole("heading", { name: "Desafios da comunidade" }).isVisible()) ||
      (await page.getByRole("link", { name: "Jogar" }).first().isVisible());

    expect(hasContent).toBe(true);
  });

  test("logo returns to home from quizzes page", async ({ page }) => {
    await page.goto(`${BASE_URL}/quizzes`);

    await page.getByRole("link", { name: "Hootka" }).click();

    await expect(page).toHaveURL(BASE_URL + "/");
    await expect(
      page.getByRole("heading", {
        name: "Escolha como deseja começar.",
      })
    ).toBeVisible();
  });

  test("has link to create challenge when no challenges available", async ({ page }) => {
    await page.goto(`${BASE_URL}/quizzes`);

    const createLink = page.getByRole("link", { name: "Criar desafio" });
    const meusDesafiosLink = page.getByRole("link", { name: "Meus desafios" });

    await expect(meusDesafiosLink).toBeVisible();
    await expect(createLink).toBeVisible();
    await expect(createLink).toHaveAttribute("href", "/community/quizzes/create");
  });

  test("navigates to challenge detail when clicking Jogar", async ({ page }) => {
    await page.goto(`${BASE_URL}/quizzes`);

    const jogarButton = page.getByRole("link", { name: "Jogar" }).first();
    if (await jogarButton.isVisible({ timeout: 5000 })) {
      await jogarButton.click();
      await expect(page).toHaveURL(/\/quizzes\/[^/]+/);
    }
  });
});
