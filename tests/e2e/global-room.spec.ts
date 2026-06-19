import { test, expect } from "@playwright/test";
import { SEED_USERS, SEED_QUIZ } from "./fixtures/emulator-fixtures";

test.describe("Global room - quiz flow with Firebase Emulator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/test-login");
    await page.getByLabel("E-mail").fill(SEED_USERS.user.email);
    await page.getByLabel("Senha").fill(SEED_USERS.user.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/quizzes/, { timeout: 10000 });
  });

  test("lists quizzes and navigates to quiz detail", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Explorar" })
    ).toBeVisible();

    const quizLink = page.getByRole("link", { name: "Jogar" }).first();
    if (await quizLink.isVisible({ timeout: 5000 })) {
      await quizLink.click();
      await expect(page).toHaveURL(new RegExp(`/quizzes/${SEED_QUIZ.slug}`));
      await expect(
        page.getByRole("heading", { name: SEED_QUIZ.title })
      ).toBeVisible();
    }
  });

  test("plays quiz from start to ranking", async ({ page }) => {
    await page.goto(`/quizzes/${SEED_QUIZ.slug}`);
    await expect(
      page.getByRole("heading", { name: SEED_QUIZ.title })
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Iniciar tentativa" }).click();
    await expect(page).toHaveURL(new RegExp(`/quizzes/${SEED_QUIZ.slug}/play`));

    await expect(
      page.getByText("Preparando sua tentativa")
    ).toBeVisible({ timeout: 3000 });

    await expect(
      page.getByText("Qual a capital do Brasil?")
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "Brasília" }).click();

    await expect(
      page.getByRole("button", { name: "Próxima pergunta" })
    ).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Próxima pergunta" }).click();

    await expect(
      page.getByText("Quanto é 2 + 2?")
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "4" }).click();

    await expect(
      page.getByRole("button", { name: "Ver ranking final" })
    ).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Ver ranking final" }).click();

    await expect(page).toHaveURL(new RegExp(`/quizzes/${SEED_QUIZ.slug}/ranking`), {
      timeout: 15000,
    });
    await expect(
      page.getByRole("heading", { name: /ranking|Ranking/i })
    ).toBeVisible();
  });

  test("navigates to ranking page", async ({ page }) => {
    await page.goto(`/quizzes/${SEED_QUIZ.slug}`);
    await expect(
      page.getByRole("heading", { name: SEED_QUIZ.title })
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("link", { name: "Ver ranking completo" }).click();
    await expect(page).toHaveURL(new RegExp(`/quizzes/${SEED_QUIZ.slug}/ranking`));
  });
});
