import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("Explore quizzes flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("navigates from home to quizzes page via link", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Aprenda, ensine e se divirta com quizzes ao vivo.",
      })
    ).toBeVisible();

    await page.getByRole("link", { name: "Explorar quizzes" }).click();

    await expect(page).toHaveURL(/\/quizzes/);
    await expect(page.getByRole("heading", { name: "Explorar" })).toBeVisible();
    await expect(page.getByText(/Quizzes públicos/)).toBeVisible();
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
      (await page.getByText("Carregando quizzes...").isVisible()) ||
      (await page.getByText("Nenhum quiz disponível no momento.").isVisible()) ||
      (await page.getByRole("heading", { name: "Quizzes oficiais" }).isVisible()) ||
      (await page.getByRole("heading", { name: "Quizzes da comunidade" }).isVisible()) ||
      (await page.getByRole("link", { name: "Abrir quiz" }).first().isVisible());

    expect(hasContent).toBe(true);
  });

  test("logo returns to home from quizzes page", async ({ page }) => {
    await page.goto(`${BASE_URL}/quizzes`);

    await page.getByRole("link", { name: "Hootka" }).click();

    await expect(page).toHaveURL(BASE_URL + "/");
    await expect(
      page.getByRole("heading", {
        name: "Aprenda, ensine e se divirta com quizzes ao vivo.",
      })
    ).toBeVisible();
  });

  test("has link to create quiz when no quizzes available", async ({ page }) => {
    await page.goto(`${BASE_URL}/quizzes`);

    const createLink = page.getByRole("link", { name: "Criar quiz" });
    const meusQuizzesLink = page.getByRole("link", { name: "Meus quizzes" });

    await expect(meusQuizzesLink).toBeVisible();
    await expect(createLink).toBeVisible();
    await expect(createLink).toHaveAttribute("href", "/community/quizzes/create");
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
