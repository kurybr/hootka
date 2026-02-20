#!/usr/bin/env node
/**
 * Cria sala, inicia o jogo e mantém conexão do host.
 * Necessário para cenários B (burst) e C (jogo completo).
 * O host precisa estar conectado para o jogo rodar.
 *
 * Uso: node load-tests/seed-and-start.js
 * Saída: JSON com { roomId, code }
 */

const { io } = require("socket.io-client");

const TARGET = process.env.TARGET || "http://localhost:3000";
const HOST_ID = "load-test-host-" + Date.now();

const SAMPLE_QUESTIONS = [
  { text: "P1?", options: ["A", "B", "C", "D"], correctOptionIndex: 0 },
  { text: "P2?", options: ["A", "B", "C", "D"], correctOptionIndex: 1 },
  { text: "P3?", options: ["A", "B", "C", "D"], correctOptionIndex: 2 },
  { text: "P4?", options: ["A", "B", "C", "D"], correctOptionIndex: 3 },
  { text: "P5?", options: ["A", "B", "C", "D"], correctOptionIndex: 0 },
  { text: "P6?", options: ["A", "B", "C", "D"], correctOptionIndex: 1 },
  { text: "P7?", options: ["A", "B", "C", "D"], correctOptionIndex: 2 },
  { text: "P8?", options: ["A", "B", "C", "D"], correctOptionIndex: 3 },
  { text: "P9?", options: ["A", "B", "C", "D"], correctOptionIndex: 0 },
  { text: "P10?", options: ["A", "B", "C", "D"], correctOptionIndex: 1 },
];

async function createAndStart() {
  return new Promise((resolve, reject) => {
    const socket = io(TARGET, {
      auth: { hostId: HOST_ID },
      transports: ["websocket"],
      reconnection: false,
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error("Timeout: servidor não respondeu em 15s"));
    }, 15000);

    let roomId, code;

    socket.on("connect", () => {
      socket.emit("room:create", { questions: SAMPLE_QUESTIONS });
    });

    socket.on("room:created", (data) => {
      roomId = data.roomId;
      code = data.code;
      socket.emit("game:start");
    });

    socket.on("room:state", (room) => {
      if (room?.status === "playing") {
        clearTimeout(timeout);
        resolve({ roomId, code, socket });
      }
    });

    socket.on("error", (err) => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error(err?.message || "Erro"));
    });

    socket.on("connect_error", (err) => {
      clearTimeout(timeout);
      reject(new Error("Falha ao conectar: " + (err?.message || err)));
    });
  });
}

createAndStart()
  .then(({ roomId, code, socket }) => {
    console.log(JSON.stringify({ roomId, code }));
    process.on("SIGINT", () => {
      socket.disconnect();
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      socket.disconnect();
      process.exit(0);
    });
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
