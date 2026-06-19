#!/usr/bin/env -S npx tsx
/**
 * Simula N jogadores entrando numa sala ao vivo.
 *
 * Suporta os dois providers do Hootka:
 *   - websocket (Socket.IO + memória) — padrão local sem Firebase
 *   - firebase (API REST + Realtime Database)
 *
 * Pré-requisitos:
 *   - Servidor rodando (`npm run dev`)
 *   - Sala criada pelo host e ainda em status "waiting"
 *   - Provider do script igual ao do browser (use --provider auto)
 *
 * Uso:
 *   npx tsx scripts/simulate-players.ts <CODIGO> <QTD> [opções]
 *
 * Exemplos:
 *   npx tsx scripts/simulate-players.ts ABC123 20
 *   npx tsx scripts/simulate-players.ts ABC123 50 --answer-auto
 *   npm run simulate:players -- ABC123 30 --answer-auto --provider auto
 */
import { config } from "dotenv";
import { resolve } from "path";
import { io, type Socket } from "socket.io-client";
import type { Room } from "../src/types/quiz";

const projectRoot = resolve(__dirname, "..");
config({ path: resolve(projectRoot, ".env") });
config({ path: resolve(projectRoot, ".env.local") });

type Provider = "websocket" | "firebase" | "auto";

interface Player {
  name: string;
  participantId: string;
  roomId: string;
  answersSent: number;
  socket?: Socket;
  pollTimer?: ReturnType<typeof setInterval>;
}

interface Options {
  baseUrl: string;
  roomCode: string;
  count: number;
  namePrefix: string;
  joinDelayMs: number;
  answerAuto: boolean;
  answerDelayMin: number;
  answerDelayMax: number;
  alwaysCorrect: boolean;
  provider: Provider;
  firebaseDatabaseUrl: string | null;
}

function printUsage(): void {
  console.error(`
Uso: npx tsx scripts/simulate-players.ts <CODIGO> <QTD> [opções]

Exemplos:
  npx tsx scripts/simulate-players.ts ABC123 20
  npx tsx scripts/simulate-players.ts ABC123 50 --answer-auto
  npm run simulate:players -- ABC123 30 --answer-auto --provider auto

Opções:
  --provider <modo>        websocket | firebase | auto (padrão: auto)
  --base-url <url>         URL do servidor (padrão: http://localhost:3000)
  --name-prefix <texto>    Prefixo do nome dos bots (padrão: "Bot")
  --delay-ms <ms>          Intervalo entre cada entrada (padrão: 50)
  --answer-auto            Responde automaticamente quando o jogo iniciar
  --answer-delay-min <ms>  Atraso mínimo antes de responder (padrão: 500)
  --answer-delay-max <ms>  Atraso máximo antes de responder (padrão: 3500)
  --always-correct         Sempre escolhe a alternativa correta (requer --answer-auto)
`);
}

function defaultProviderFromEnv(): Provider {
  const envProvider = process.env.NEXT_PUBLIC_PROVIDER?.trim().toLowerCase();
  if (envProvider === "firebase") return "firebase";
  if (envProvider === "websocket") return "websocket";
  return "auto";
}

function parseArgs(argv: string[]): Options {
  const positional: string[] = [];
  let baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  let namePrefix = "Bot";
  let joinDelayMs = 50;
  let answerAuto = false;
  let answerDelayMin = 500;
  let answerDelayMax = 3500;
  let alwaysCorrect = false;
  let provider: Provider = defaultProviderFromEnv();

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--provider":
        provider = (argv[++i] ?? provider) as Provider;
        break;
      case "--base-url":
        baseUrl = argv[++i] ?? baseUrl;
        break;
      case "--name-prefix":
        namePrefix = argv[++i] ?? namePrefix;
        break;
      case "--delay-ms":
        joinDelayMs = parseInt(argv[++i] ?? "50", 10);
        break;
      case "--answer-auto":
        answerAuto = true;
        break;
      case "--answer-delay-min":
        answerDelayMin = parseInt(argv[++i] ?? "500", 10);
        break;
      case "--answer-delay-max":
        answerDelayMax = parseInt(argv[++i] ?? "3500", 10);
        break;
      case "--always-correct":
        alwaysCorrect = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
        break;
      default:
        if (arg.startsWith("-")) {
          console.error(`Opção desconhecida: ${arg}`);
          printUsage();
          process.exit(1);
        }
        positional.push(arg);
    }
  }

  if (!["websocket", "firebase", "auto"].includes(provider)) {
    console.error(`Provider inválido: ${provider}`);
    printUsage();
    process.exit(1);
  }

  const roomCode = positional[0]?.trim().toUpperCase() ?? "";
  const count = parseInt(positional[1] ?? "0", 10);

  if (!roomCode || roomCode.length !== 6 || !/^[A-Z0-9]+$/.test(roomCode)) {
    printUsage();
    process.exit(1);
  }
  if (!Number.isFinite(count) || count < 1) {
    console.error("Informe uma quantidade válida de jogadores (>= 1).");
    printUsage();
    process.exit(1);
  }
  if (answerDelayMin > answerDelayMax) {
    console.error("--answer-delay-min não pode ser maior que --answer-delay-max.");
    process.exit(1);
  }

  const firebaseDatabaseUrl =
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim() || null;

  return {
    baseUrl,
    roomCode,
    count,
    namePrefix,
    joinDelayMs,
    answerAuto,
    answerDelayMin,
    answerDelayMax,
    alwaysCorrect,
    provider,
    firebaseDatabaseUrl,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function normalizeQuestions(raw: unknown): Room["questions"] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as Room["questions"];
  if (typeof raw === "object") {
    const obj = raw as Record<string, Room["questions"][number]>;
    return Object.keys(obj)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => obj[k])
      .filter(Boolean);
  }
  return [];
}

function normalizeRoomFromRtdb(data: unknown, roomId: string): Room | null {
  if (data == null || typeof data !== "object") return null;
  const r = data as Record<string, unknown>;
  if (typeof r.code !== "string" || typeof r.hostId !== "string") return null;

  const validStatuses: Room["status"][] = ["waiting", "playing", "result", "finished"];
  const status = validStatuses.includes(r.status as Room["status"])
    ? (r.status as Room["status"])
    : "waiting";

  return {
    id: roomId,
    code: r.code,
    hostId: r.hostId,
    status,
    currentQuestionIndex:
      typeof r.currentQuestionIndex === "number" ? r.currentQuestionIndex : 0,
    questionStartTimestamp:
      typeof r.questionStartTimestamp === "number" ? r.questionStartTimestamp : null,
    participants:
      r.participants != null && typeof r.participants === "object"
        ? (r.participants as Room["participants"])
        : {},
    questions: normalizeQuestions(r.questions),
    answers:
      r.answers != null && typeof r.answers === "object"
        ? (r.answers as Room["answers"])
        : {},
    questionTimeLimitMs:
      typeof r.questionTimeLimitMs === "number" ? r.questionTimeLimitMs : 20_000,
    optionPaletteId: r.optionPaletteId as Room["optionPaletteId"],
  };
}

async function fetchFirebaseRoom(
  databaseUrl: string,
  roomId: string
): Promise<Room | null> {
  const url = `${databaseUrl.replace(/\/$/, "")}/rooms/${roomId}.json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return normalizeRoomFromRtdb(data, roomId);
}

async function joinPlayerFirebase(
  baseUrl: string,
  roomCode: string,
  name: string
): Promise<Player> {
  const res = await fetch(`${baseUrl}/api/firebase/rooms/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: roomCode, name }),
  });
  const data = (await res.json()) as {
    participantId?: string;
    roomId?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(`${name}: ${data.error ?? "Erro ao entrar na sala"}`);
  }
  if (!data.participantId || !data.roomId) {
    throw new Error(`${name}: resposta inválida do servidor`);
  }
  return {
    name,
    participantId: data.participantId,
    roomId: data.roomId,
    answersSent: 0,
  };
}

function joinPlayerWebsocket(
  baseUrl: string,
  roomCode: string,
  name: string
): Promise<Player> {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, { transports: ["websocket"] });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error(`${name}: timeout ao entrar na sala`));
    }, 15_000);

    socket.once("room:joined", (data: { participantId: string; roomId: string }) => {
      clearTimeout(timeout);
      resolve({
        name,
        participantId: data.participantId,
        roomId: data.roomId,
        answersSent: 0,
        socket,
      });
    });

    socket.once("error", (err: { message: string }) => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error(`${name}: ${err.message}`));
    });

    socket.on("connect_error", () => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error(`${name}: não foi possível conectar em ${baseUrl}`));
    });

    socket.on("connect", () => {
      socket.emit("room:join", { code: roomCode, name });
    });
  });
}

async function submitAnswerFirebase(
  baseUrl: string,
  player: Player,
  optionIndex: number
): Promise<void> {
  const res = await fetch(
    `${baseUrl}/api/firebase/rooms/${player.roomId}/answer`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId: player.participantId,
        optionIndex,
      }),
    }
  );
  if (res.ok) {
    player.answersSent += 1;
    return;
  }
  const data = (await res.json()) as { error?: string; code?: string };
  const msg = data.error ?? "Erro ao enviar resposta";
  if (data.code === "RESPOSTA_DUPLICADA") return;
  throw new Error(`${player.name}: ${msg}`);
}

function scheduleAnswer(
  player: Player,
  room: Room,
  opts: Options,
  submit: (optionIndex: number) => void
): void {
  const question = room.questions[room.currentQuestionIndex];
  if (!question || question.options.length === 0) return;

  const qKey = String(room.currentQuestionIndex);
  const alreadyAnswered = Boolean(room.answers[qKey]?.[player.participantId]);
  if (alreadyAnswered) return;

  const optionIndex = opts.alwaysCorrect
    ? question.correctOptionIndex
    : Math.floor(Math.random() * question.options.length);

  const delay = randomBetween(opts.answerDelayMin, opts.answerDelayMax);
  setTimeout(() => submit(optionIndex), delay);
}

function setupAutoAnswerWebsocket(player: Player, opts: Options): void {
  if (!opts.answerAuto || !player.socket) return;

  let roomState: Room | null = null;
  let lastQuestionIndex = -1;

  const submit = (optionIndex: number) => {
    player.socket?.emit("answer:submit", { optionIndex });
    player.answersSent += 1;
  };

  const maybeAnswer = () => {
    if (!roomState || roomState.status !== "playing") return;
    if (roomState.currentQuestionIndex === lastQuestionIndex) return;
    lastQuestionIndex = roomState.currentQuestionIndex;
    scheduleAnswer(player, roomState, opts, submit);
  };

  player.socket.on("room:state", (room: Room) => {
    roomState = room;
  });

  player.socket.on(
    "game:status-changed",
    (data: { status: Room["status"]; questionIndex: number }) => {
      if (data.status !== "playing") return;
      if (roomState) {
        roomState = { ...roomState, status: data.status, currentQuestionIndex: data.questionIndex };
      }
      maybeAnswer();
    }
  );
}

function setupAutoAnswerFirebase(player: Player, opts: Options): void {
  if (!opts.answerAuto || !opts.firebaseDatabaseUrl) return;

  let lastQuestionIndex = -1;
  let answering = false;

  player.pollTimer = setInterval(async () => {
    if (answering) return;
    try {
      const room = await fetchFirebaseRoom(opts.firebaseDatabaseUrl!, player.roomId);
      if (!room || room.status !== "playing") return;
      if (room.currentQuestionIndex === lastQuestionIndex) return;

      const qKey = String(room.currentQuestionIndex);
      if (room.answers[qKey]?.[player.participantId]) {
        lastQuestionIndex = room.currentQuestionIndex;
        return;
      }

      answering = true;
      lastQuestionIndex = room.currentQuestionIndex;
      scheduleAnswer(player, room, opts, (optionIndex) => {
        submitAnswerFirebase(opts.baseUrl, player, optionIndex).catch((err) => {
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("RESPOSTA_DUPLICADA") && !msg.includes("já respondeu")) {
            console.error(`✗ ${msg}`);
          }
        }).finally(() => {
          answering = false;
        });
      });
    } catch {
      // Ignora falhas temporárias de polling
    }
  }, 400);
}

async function findFirebaseRoomIdByCode(
  databaseUrl: string,
  roomCode: string
): Promise<string | null> {
  const url = `${databaseUrl.replace(/\/$/, "")}/rooms.json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const rooms = (await res.json()) as Record<string, { code?: string }> | null;
  if (!rooms) return null;
  const normalized = roomCode.toUpperCase();
  for (const [roomId, data] of Object.entries(rooms)) {
    if (data?.code?.toUpperCase() === normalized) return roomId;
  }
  return null;
}

async function detectProvider(opts: Options): Promise<"websocket" | "firebase"> {
  if (opts.provider === "websocket") return "websocket";
  if (opts.provider === "firebase") return "firebase";

  if (opts.firebaseDatabaseUrl) {
    const firebaseRoomId = await findFirebaseRoomIdByCode(
      opts.firebaseDatabaseUrl,
      opts.roomCode
    );
    if (firebaseRoomId) {
      console.log(
        `Provider detectado: firebase (sala ${firebaseRoomId.slice(0, 8)}…). ` +
          "O browser provavelmente usa NEXT_PUBLIC_PROVIDER=firebase."
      );
      return "firebase";
    }
  }

  console.log("Provider detectado: websocket");
  return "websocket";
}

async function joinPlayer(
  provider: "websocket" | "firebase",
  opts: Options,
  name: string
): Promise<Player> {
  if (provider === "firebase") {
    return joinPlayerFirebase(opts.baseUrl, opts.roomCode, name);
  }
  return joinPlayerWebsocket(opts.baseUrl, opts.roomCode, name);
}

function setupAutoAnswer(
  provider: "websocket" | "firebase",
  player: Player,
  opts: Options
): void {
  if (provider === "firebase") {
    setupAutoAnswerFirebase(player, opts);
  } else {
    setupAutoAnswerWebsocket(player, opts);
  }
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const players: Player[] = [];
  let joinFailures = 0;

  console.log(`Conectando em ${opts.baseUrl}`);
  console.log(`Sala: ${opts.roomCode} | Jogadores: ${opts.count}`);
  console.log(`Provider: ${opts.provider}`);
  if (opts.answerAuto) {
    console.log(
      `Resposta automática: sim (${opts.answerDelayMin}–${opts.answerDelayMax} ms)` +
        (opts.alwaysCorrect ? " | sempre correta" : "")
    );
  }
  console.log("");

  let provider = await detectProvider(opts);
  if (opts.provider !== "auto") {
    console.log(`Usando provider: ${provider}`);
  }

  if (provider === "firebase" && opts.answerAuto && !opts.firebaseDatabaseUrl) {
    console.warn(
      "Aviso: NEXT_PUBLIC_FIREBASE_DATABASE_URL não definido — --answer-auto pode não funcionar no modo firebase."
    );
  }

  for (let i = 0; i < opts.count; i++) {
    const name = `${opts.namePrefix} ${String(i + 1).padStart(3, "0")}`;
    try {
      const player = await joinPlayer(provider, opts, name);
      setupAutoAnswer(provider, player, opts);
      players.push(player);
      console.log(`✓ ${name} entrou (${players.length}/${opts.count})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      if (
        i === 0 &&
        opts.provider === "auto" &&
        provider === "websocket" &&
        msg.includes("Sala não encontrada") &&
        opts.firebaseDatabaseUrl
      ) {
        console.log("Sala não encontrada via websocket — tentando firebase...");
        provider = "firebase";
        try {
          const player = await joinPlayer(provider, opts, name);
          setupAutoAnswer(provider, player, opts);
          players.push(player);
          console.log(`✓ ${name} entrou (${players.length}/${opts.count})`);
          continue;
        } catch (retryErr) {
          joinFailures += 1;
          const retryMsg =
            retryErr instanceof Error ? retryErr.message : String(retryErr);
          console.error(`✗ ${retryMsg}`);
          break;
        }
      }

      joinFailures += 1;
      console.error(`✗ ${msg}`);
      if (msg.includes("Sala cheia") || msg.includes("já está em andamento")) {
        break;
      }
    }

    if (i < opts.count - 1 && opts.joinDelayMs > 0) {
      await sleep(opts.joinDelayMs);
    }
  }

  console.log("");
  console.log(`Conectados: ${players.length}/${opts.count} (${provider})`);
  if (joinFailures > 0) {
    console.log(`Falhas: ${joinFailures}`);
  }
  if (players.length === 0) {
    process.exit(1);
  }

  console.log("Aguardando o host iniciar o jogo. Ctrl+C para desconectar todos.");

  const shutdown = () => {
    console.log("\nDesconectando bots...");
    for (const player of players) {
      player.pollTimer && clearInterval(player.pollTimer);
      player.socket?.disconnect();
    }
    const totalAnswers = players.reduce((sum, p) => sum + p.answersSent, 0);
    console.log(`Respostas enviadas: ${totalAnswers}`);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await new Promise<void>(() => {});
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
