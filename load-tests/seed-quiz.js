#!/usr/bin/env node
/**
 * Script que pré-cria uma sala via Socket.IO para os testes de carga.
 * Conecta como host, cria sala com 5 perguntas, exporta roomId e code.
 *
 * Uso: node load-tests/seed-quiz.js
 * Ou: ROOM_CODE=ABC123 node load-tests/seed-quiz.js (usa código fixo se servidor permitir)
 *
 * Saída: JSON com { roomId, code } para uso nos cenários
 */

const { io } = require("socket.io-client");

const TARGET = process.env.TARGET || "http://localhost:3000";
const HOST_ID = "load-test-host-" + Date.now();

const SAMPLE_QUESTIONS = [
  {
    text: "Qual é a capital do Brasil?",
    options: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
    correctOptionIndex: 2,
  },
  {
    text: "Quantos planetas existem no sistema solar?",
    options: ["7", "8", "9", "10"],
    correctOptionIndex: 1,
  },
  {
    text: "Qual linguagem roda no navegador?",
    options: ["Python", "Java", "JavaScript", "C++"],
    correctOptionIndex: 2,
  },
  {
    text: "Em que ano o homem pisou na Lua?",
    options: ["1965", "1969", "1972", "1975"],
    correctOptionIndex: 1,
  },
  {
    text: "Qual é o maior oceano do mundo?",
    options: ["Atlântico", "Índico", "Pacífico", "Ártico"],
    correctOptionIndex: 2,
  },
];

async function createSeedRoom() {
  return new Promise((resolve, reject) => {
    const socket = io(TARGET, {
      auth: { hostId: HOST_ID },
      transports: ["websocket"],
      reconnection: false,
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error("Timeout: servidor não respondeu em 10s"));
    }, 10000);

    socket.on("connect", () => {
      socket.emit("room:create", { questions: SAMPLE_QUESTIONS });
    });

    socket.on("room:created", (data) => {
      clearTimeout(timeout);
      socket.disconnect();
      resolve({ roomId: data.roomId, code: data.code });
    });

    socket.on("error", (err) => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error(err?.message || "Erro ao criar sala"));
    });

    socket.on("connect_error", (err) => {
      clearTimeout(timeout);
      reject(new Error("Falha ao conectar: " + (err?.message || err)));
    });
  });
}

createSeedRoom()
  .then(({ roomId, code }) => {
    console.log(JSON.stringify({ roomId, code }));
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
