import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("Explore quizzes flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("navigates from home to quizzes page via card", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Hootka" })).toBeVisible();

    await page.getByRole("link", { name: "Ranking global" }).first().click();

    await expect(page).toHaveURL(/\/quizzes/);
    await expect(page.getByRole("heading", { name: "Quizzes Globais" })).toBeVisible();
    await expect(page.getByText(/Descubra quizzes oficiais/)).toBeVisible();
  });

  test("navigates from header to quizzes page", async ({ page }) => {
    await page.getByRole("link", { name: "Quizzes" }).click();

    await expect(page).toHaveURL(/\/quizzes/);
    await expect(page.getByRole("heading", { name: "Quizzes Globais" })).toBeVisible();
  });

  test("shows loading or content on quizzes page", async ({ page }) => {
    await page.goto(`${BASE_URL}/quizzes`);

    await expect(
      page.getByRole("heading", { name: "Quizzes Globais" })
    ).toBeVisible({ timeout: 10000 });

    const hasContent =
      (await page.getByText("Carregando quizzes...").isVisible()) ||
      (await page.getByText("Nenhum quiz disponível no momento.").isVisible()) ||
      (await page.getByRole("heading", { name: "Quizzes oficiais" }).isVisible()) ||
      (await page.getByRole("heading", { name: "Quizzes da comunidade" }).isVisible()) ||
      (await page.getByRole("link", { name: "Abrir quiz" }).first().isVisible());

    expect(hasContent).toBe(true);
  });

  test("back button returns to home", async ({ page }) => {
    await page.goto(`${BASE_URL}/quizzes`);

    await page.getByRole("link", { name: "Voltar" }).first().click();

    await expect(page).toHaveURL(BASE_URL + "/");
    await expect(page.getByRole("heading", { name: "Hootka" })).toBeVisible();
  });

  test("has link to create quiz when no quizzes available", async ({ page }) => {
    await page.goto(`${BASE_URL}/quizzes`);

    const createLink = page.getByRole("link", { name: "Criar quiz" });
    const meusQuizzesLink = page.getByRole("link", { name: "Meus quizzes" });

    await expect(meusQuizzesLink).toBeVisible();
    if (await createLink.isVisible()) {
      await expect(createLink).toHaveAttribute("href", "/community/quizzes/create");
    }
  });

  test("navigates to quiz detail when clicking Abrir quiz", async ({ page }) => {
    await page.goto(`${BASE_URL}/quizzes`);

    const abrirQuizButton = page.getByRole("link", { name: "Abrir quiz" }).first();
    if (await abrirQuizButton.isVisible({ timeout: 5000 })) {
      await abrirQuizButton.click();
      await expect(page).toHaveURL(/\/quizzes\/[^/]+/);
    }
  });
});
