import type { Answer, Participant, Question, Room } from "../types/quiz";
import type { IGameStore } from "./IGameStore";
import { resolveQuestionTimeLimitMs } from "../lib/questionUtils";
import { resolveQuizOptionPaletteId } from "../lib/quizOptionPalettes";
import {
  normalizeAnswersFromRtdb,
  normalizeQuestionsFromRtdb,
} from "../lib/roomRtdbNormalization";
import {
  getFirebaseAdminDatabase,
  ROOMS_PATH,
} from "../lib/firebaseAdmin";

/**
 * RTDB pode omitir objetos vazios ou devolver nós sem o shape completo do tipo Room.
 */
function normalizeRoomData(data: unknown): Room | null {
  if (data == null || typeof data !== "object") return null;
  const r = data as Record<string, unknown>;
  if (
    typeof r.id !== "string" ||
    typeof r.code !== "string" ||
    typeof r.hostId !== "string"
  ) {
    return null;
  }
  const participants =
    r.participants != null &&
    typeof r.participants === "object" &&
    !Array.isArray(r.participants)
      ? (r.participants as Record<string, Participant>)
      : {};
  const answers = normalizeAnswersFromRtdb(r.answers);
  const questions = normalizeQuestionsFromRtdb(r.questions);
  const validStatuses: Room["status"][] = [
    "waiting",
    "playing",
    "result",
    "finished",
  ];
  const rawStatus = r.status;
  const status = validStatuses.includes(rawStatus as Room["status"])
    ? (rawStatus as Room["status"])
    : "waiting";
  return {
    id: r.id,
    code: r.code,
    hostId: r.hostId,
    status,
    currentQuestionIndex:
      typeof r.currentQuestionIndex === "number" ? r.currentQuestionIndex : 0,
    questionStartTimestamp:
      r.questionStartTimestamp === null ||
      r.questionStartTimestamp === undefined
        ? null
        : typeof r.questionStartTimestamp === "number"
          ? r.questionStartTimestamp
          : null,
    participants,
    questions,
    answers,
    questionTimeLimitMs: resolveQuestionTimeLimitMs(r.questionTimeLimitMs),
    optionPaletteId: resolveQuizOptionPaletteId(r.optionPaletteId),
  };
}

export class FirebaseStore implements IGameStore {
  private getDb() {
    const db = getFirebaseAdminDatabase();
    if (!db) throw new Error("Firebase Admin não configurado");
    return db;
  }

  async createRoom(room: Room): Promise<void> {
    const db = this.getDb();
    const ref = db.ref(`${ROOMS_PATH}/${room.id}`);
    await ref.set(room);
  }

  async getRoom(roomId: string): Promise<Room | null> {
    const db = getFirebaseAdminDatabase();
    if (!db) return null;
    const snapshot = await db.ref(`${ROOMS_PATH}/${roomId}`).get();
    const data = snapshot.val();
    return normalizeRoomData(data);
  }

  async getRoomByCode(code: string): Promise<Room | null> {
    const db = getFirebaseAdminDatabase();
    if (!db) return null;
    const snapshot = await db.ref(ROOMS_PATH).get();
    const rooms = snapshot.val();
    if (!rooms) return null;
    const normalizedCode = code.toUpperCase().trim();
    for (const entry of Object.values(rooms)) {
      const room = normalizeRoomData(entry);
      if (room && room.code === normalizedCode) return room;
    }
    return null;
  }

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<void> {
    const db = this.getDb();
    await db.ref(`${ROOMS_PATH}/${roomId}`).update(updates);
  }

  async addParticipant(
    roomId: string,
    participant: Participant
  ): Promise<void> {
    const db = this.getDb();
    await db
      .ref(`${ROOMS_PATH}/${roomId}/participants/${participant.id}`)
      .set(participant);
  }

  async updateParticipantConnection(
    roomId: string,
    participantId: string,
    connected: boolean
  ): Promise<void> {
    const db = this.getDb();
    await db
      .ref(`${ROOMS_PATH}/${roomId}/participants/${participantId}/connected`)
      .set(connected);
  }

  async addAnswer(
    roomId: string,
    questionIndex: number,
    answer: Answer
  ): Promise<void> {
    const db = this.getDb();
    await db
      .ref(
        `${ROOMS_PATH}/${roomId}/answers/${questionIndex}/${answer.participantId}`
      )
      .set(answer);
  }

  async updateParticipantScore(
    roomId: string,
    participantId: string,
    scoreIncrement: number,
    responseTime: number
  ): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) return;
    const participant = room.participants[participantId];
    if (!participant) return;

    const db = this.getDb();
    const participantRef = db.ref(
      `${ROOMS_PATH}/${roomId}/participants/${participantId}`
    );
    await participantRef.update({
      totalScore: participant.totalScore + scoreIncrement,
      totalResponseTime: participant.totalResponseTime + responseTime,
      questionsAnswered: participant.questionsAnswered + 1,
    });
  }

  async deleteRoom(roomId: string): Promise<void> {
    const db = this.getDb();
    await db.ref(`${ROOMS_PATH}/${roomId}`).remove();
  }
}
