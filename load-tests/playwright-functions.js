/**
 * Funções de teste Playwright para cenários de carga do Hootka.
 * Usado via config.processor nos cenários artillery com engine playwright.
 *
 * Cada função recebe (page, vuContext, events, test).
 * vuContext.vars contém: roomCode (do ROOM_CODE), participantName (gerado).
 * O nome tem no máximo 30 caracteres (regra do app).
 */

const MAX_NAME_LENGTH = 30;

function generateParticipantName() {
  const id = (Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)).slice(0, 24);
  return ("User_" + id).slice(0, MAX_NAME_LENGTH);
}

function setRoomCodeFromEnv(context, events, done) {
  if (process.env.ROOM_CODE) {
    context.vars.roomCode = process.env.ROOM_CODE;
  } else if (!context.vars.roomCode) {
    context.vars.roomCode = "LOAD01";
  }
  context.vars.participantName = generateParticipantName();
  return done();
}

/**
 * Fluxo: Home -> Entrar em Sala -> Preencher código e nome -> Entrar -> Aguardar /play
 */
async function joinRoomFlow(page, vuContext, events, test) {
  const { step } = test || {};
  const roomCode = vuContext.vars.roomCode || process.env.ROOM_CODE || "LOAD01";
  const participantName =
    vuContext.vars.participantName || generateParticipantName();

  const runStep = step
    ? (name, fn) => step(name, fn)
    : async (_, fn) => fn();

  // Evitar banner de cookies bloquear cliques (ConsentProvider usa hootka_analytics_consent)
  await page.addInitScript(() => {
    window.localStorage.setItem("hootka_analytics_consent", "accepted");
  });

  await runStep("home", async () => {
    await page.goto("/");
  });

  await runStep("click_entrar_em_sala", async () => {
    await page.getByRole("link", { name: "Entrar em Sala" }).click();
  });

  await runStep("fill_code", async () => {
    await page.getByLabel("Código da sala").fill(roomCode.replace(/\s/g, ""));
  });

  await runStep("fill_name", async () => {
    await page.getByLabel("Seu nome").fill(participantName);
  });

  await runStep("submit_entrar", async () => {
    await page.getByRole("button", { name: "Entrar" }).click();
  });

  await runStep("wait_play_page", async () => {
    await page.waitForURL(/\/play\/[a-zA-Z0-9-]+/, { timeout: 15000 });
  });
}

module.exports = {
  setRoomCodeFromEnv,
  joinRoomFlow,
};
