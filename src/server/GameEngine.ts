import type { Answer, Participant, Question, Room } from "../types/quiz";
import type { IGameStore } from "./IGameStore";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const QUESTION_TIMEOUT_MS = 120000;
const MAX_SCORE = 120;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function generateId(): string {
  return crypto.randomUUID();
}

export class GameEngine {
  constructor(private store: IGameStore) {}

  async createRoom(questions: Question[], hostId: string): Promise<Room> {
    const roomId = generateId();
    let code = generateCode();

    while (await this.store.getRoomByCode(code)) {
      code = generateCode();
    }

    const room: Room = {
      id: roomId,
      code,
      status: "waiting",
      hostId,
      currentQuestionIndex: 0,
      questionStartTimestamp: null,
      participants: {},
      questions,
      answers: {},
    };

    await this.store.createRoom(room);
    return room;
  }

  async joinRoom(
    code: string,
    name: string
  ): Promise<{ room: Room; participant: Participant }> {
    const room = await this.store.getRoomByCode(code);
    if (!room) {
      throw new Error("SALA_NAO_ENCONTRADA");
    }
    if (room.status !== "waiting") {
      throw new Error("SALA_JA_INICIADA");
    }

    const nameLower = name.trim().toLowerCase();
    for (const p of Object.values(room.participants)) {
      if (p.name.toLowerCase() === nameLower) {
        throw new Error("NOME_DUPLICADO");
      }
    }

    const participant: Participant = {
      id: generateId(),
      name: name.trim(),
      totalScore: 0,
      totalResponseTime: 0,
      questionsAnswered: 0,
      joinedAt: Date.now(),
      connected: true,
    };

    await this.store.addParticipant(room.id, participant);
    const updatedRoom = await this.store.getRoom(room.id);
    if (!updatedRoom) throw new Error("SALA_NAO_ENCONTRADA");
    return { room: updatedRoom, participant };
  }

  async startGame(roomId: string, hostId: string): Promise<Room> {
    const room = await this.store.getRoom(roomId);
    if (!room) throw new Error("SALA_NAO_ENCONTRADA");
    if (room.hostId !== hostId) throw new Error("APENAS_HOST_PODE_INICIAR");
    if (room.status !== "waiting") throw new Error("SALA_JA_INICIADA");

    const now = Date.now();
    await this.store.updateRoom(roomId, {
      status: "playing",
      currentQuestionIndex: 0,
      questionStartTimestamp: now,
    });

    const updated = await this.store.getRoom(roomId);
    if (!updated) throw new Error("SALA_NAO_ENCONTRADA");
    return updated;
  }

  async submitAnswer(
    roomId: string,
    participantId: string,
    questionIndex: number,
    optionIndex: number
  ): Promise<{
    correct: boolean;
    score: number;
    correctIndex: number;
    shouldTransitionToResult: boolean;
  }> {
    const room = await this.store.getRoom(roomId);
    if (!room) throw new Error("SALA_NAO_ENCONTRADA");
    if (room.status !== "playing") throw new Error("JOGO_NAO_EM_ANDAMENTO");

    const question = room.questions[questionIndex];
    if (!question) throw new Error("PERGUNTA_INVALIDA");

    const qKey = String(questionIndex);
    const existingAnswers = room.answers[qKey] ?? {};
    if (existingAnswers[participantId]) {
      throw new Error("RESPOSTA_DUPLICADA");
    }

    const questionStartTimestamp = room.questionStartTimestamp;
    if (questionStartTimestamp === null) throw new Error("TIMESTAMP_INVALIDO");

    const responseTime = Date.now() - questionStartTimestamp;
    if (responseTime > QUESTION_TIMEOUT_MS) {
      throw new Error("TEMPO_ESGOTADO");
    }

    const correct = optionIndex === question.correctOptionIndex;
    const tempoRestante = Math.max(0, QUESTION_TIMEOUT_MS - responseTime);
    const score = correct
      ? Math.round(MAX_SCORE * (tempoRestante / QUESTION_TIMEOUT_MS))
      : 0;

    const answer: Answer = {
      participantId,
      optionIndex,
      timestamp: Date.now(),
      responseTime,
      score,
    };

    await this.store.addAnswer(roomId, questionIndex, answer);
    if (correct && score > 0) {
      await this.store.updateParticipantScore(
        roomId,
        participantId,
        score,
        responseTime
      );
    }

    const updatedRoom = await this.store.getRoom(roomId);
    if (!updatedRoom) throw new Error("SALA_NAO_ENCONTRADA");

    const totalParticipants = Object.keys(updatedRoom.participants).length;
    const answeredCount = Object.keys(updatedRoom.answers[qKey] ?? {}).length;
    const shouldTransitionToResult =
      answeredCount >= totalParticipants ||
      responseTime >= QUESTION_TIMEOUT_MS - 100;

    return {
      correct,
      score,
      correctIndex: question.correctOptionIndex,
      shouldTransitionToResult,
    };
  }

  async nextQuestion(roomId: string, hostId: string): Promise<Room> {
    const room = await this.store.getRoom(roomId);
    if (!room) throw new Error("SALA_NAO_ENCONTRADA");
    if (room.hostId !== hostId) throw new Error("APENAS_HOST_PODE_AVANCAR");
    if (room.status !== "result") throw new Error("STATUS_INVALIDO");

    const nextIndex = room.currentQuestionIndex + 1;
    const hasMoreQuestions = nextIndex < room.questions.length;

    if (hasMoreQuestions) {
      await this.store.updateRoom(roomId, {
        status: "playing",
        currentQuestionIndex: nextIndex,
        questionStartTimestamp: Date.now(),
      });
    } else {
      await this.store.updateRoom(roomId, {
        status: "finished",
        currentQuestionIndex: nextIndex,
        questionStartTimestamp: null,
      });
    }

    const updated = await this.store.getRoom(roomId);
    if (!updated) throw new Error("SALA_NAO_ENCONTRADA");
    return updated;
  }

  async endGame(roomId: string, hostId: string): Promise<Room> {
    const room = await this.store.getRoom(roomId);
    if (!room) throw new Error("SALA_NAO_ENCONTRADA");
    if (room.hostId !== hostId) throw new Error("APENAS_HOST_PODE_ENCERRAR");

    await this.store.updateRoom(roomId, {
      status: "finished",
      questionStartTimestamp: null,
    });

    const updated = await this.store.getRoom(roomId);
    if (!updated) throw new Error("SALA_NAO_ENCONTRADA");
    return updated;
  }

  async forceResult(roomId: string, hostId: string): Promise<Room> {
    const room = await this.store.getRoom(roomId);
    if (!room) throw new Error("SALA_NAO_ENCONTRADA");
    if (room.hostId !== hostId) throw new Error("APENAS_HOST_PODE_ENCERRAR");
    if (room.status !== "playing") throw new Error("STATUS_INVALIDO");

    await this.store.updateRoom(roomId, {
      status: "result",
      questionStartTimestamp: null,
    });

    const updated = await this.store.getRoom(roomId);
    if (!updated) throw new Error("SALA_NAO_ENCONTRADA");
    return updated;
  }

  async transitionToResult(roomId: string): Promise<Room> {
    const room = await this.store.getRoom(roomId);
    if (!room) throw new Error("SALA_NAO_ENCONTRADA");

    await this.store.updateRoom(roomId, {
      status: "result",
      questionStartTimestamp: null,
    });

    const updated = await this.store.getRoom(roomId);
    if (!updated) throw new Error("SALA_NAO_ENCONTRADA");
    return updated;
  }

  getRanking(room: Room): Participant[] {
    return Object.values(room.participants).sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      const avgA =
        a.questionsAnswered > 0
          ? a.totalResponseTime / a.questionsAnswered
          : Infinity;
      const avgB =
        b.questionsAnswered > 0
          ? b.totalResponseTime / b.questionsAnswered
          : Infinity;
      if (avgA !== avgB) return avgA - avgB;
      return a.joinedAt - b.joinedAt;
    });
  }

  getAnswerCount(room: Room, questionIndex: number): { count: number; total: number } {
    const total = Object.keys(room.participants).length;
    const qKey = String(questionIndex);
    const count = Object.keys(room.answers[qKey] ?? {}).length;
    return { count, total };
  }
}
