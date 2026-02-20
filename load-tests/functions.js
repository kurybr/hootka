/**
 * Funções auxiliares para cenários de teste de carga do Artillery.
 * Usado via config.processor no artillery.yml
 */

const MAX_NAME_LENGTH = 30;

/**
 * Gera nome único para participante (evita NOME_DUPLICADO).
 * O nome tem no máximo 30 caracteres (regra do app).
 */
function generateUniqueName(context) {
  const id = (context.vars.$uuid || Math.random().toString(36).slice(2, 10)).slice(0, 12);
  const suffix = Date.now().toString(36).slice(-6);
  const name = `User_${id}_${suffix}`;
  context.vars.participantName = name.slice(0, MAX_NAME_LENGTH);
  return context.vars.participantName;
}

/**
 * Armazena código da sala no contexto (preenchido pelo seed ou cenário anterior)
 */
function generateRoomCode(context) {
  if (!context.vars.roomCode) {
    context.vars.roomCode = process.env.ROOM_CODE || "LOAD01";
  }
  return context.vars.roomCode;
}

/**
 * Simula tempo humano de resposta (1-10 segundos)
 */
function randomDelay(context) {
  const min = 1000;
  const max = 10000;
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  context.vars.thinkTime = Math.floor(ms / 1000);
  return ms;
}

/**
 * Escolhe alternativa aleatória (0-3)
 */
function pickRandomOption(context) {
  context.vars.optionIndex = Math.floor(Math.random() * 4);
  return context.vars.optionIndex;
}

/**
 * Captura roomId e code do room:created (para host)
 */
function captureRoomCreated(context, event, next) {
  if (event.roomId) context.vars.roomId = event.roomId;
  if (event.code) context.vars.roomCode = event.code;
  return next();
}

/**
 * Captura participantId do room:joined (para participante)
 */
function captureRoomJoined(context, event, eventData, next) {
  if (eventData && eventData.participantId) {
    context.vars.participantId = eventData.participantId;
  }
  if (eventData && eventData.roomId) {
    context.vars.roomId = eventData.roomId;
  }
  return next();
}

/**
 * Gera hostId único para cenário de criação de sala
 */
function setHostId(context, events, done) {
  context.vars.hostId = "load-host-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  return done();
}

/**
 * Define roomCode a partir de process.env.ROOM_CODE (para cenários de participante)
 */
function setRoomCodeFromEnv(context, events, done) {
  if (process.env.ROOM_CODE) {
    context.vars.roomCode = process.env.ROOM_CODE;
  } else if (!context.vars.roomCode) {
    context.vars.roomCode = "LOAD01";
  }
  return done();
}

/**
 * Retorna as perguntas padrão para criação de sala
 */
function getSampleQuestions(context, events, done) {
  context.vars.questions = [
    { text: "P1?", options: ["A", "B", "C", "D"], correctOptionIndex: 0 },
    { text: "P2?", options: ["A", "B", "C", "D"], correctOptionIndex: 1 },
    { text: "P3?", options: ["A", "B", "C", "D"], correctOptionIndex: 2 },
    { text: "P4?", options: ["A", "B", "C", "D"], correctOptionIndex: 3 },
    { text: "P5?", options: ["A", "B", "C", "D"], correctOptionIndex: 0 },
  ];
  return done();
}

module.exports = {
  generateUniqueName,
  generateRoomCode,
  randomDelay,
  pickRandomOption,
  captureRoomCreated,
  captureRoomJoined,
  setHostId,
  getSampleQuestions,
  setRoomCodeFromEnv,
};
