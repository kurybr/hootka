import type { Answer, Participant, Room } from "../types/quiz";
import type { IGameStore } from "./IGameStore";
import {
  getFirebaseAdminDatabase,
  ROOMS_PATH,
} from "../lib/firebaseAdmin";

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
    return data ? (data as Room) : null;
  }

  async getRoomByCode(code: string): Promise<Room | null> {
    const db = getFirebaseAdminDatabase();
    if (!db) return null;
    const snapshot = await db.ref(ROOMS_PATH).get();
    const rooms = snapshot.val();
    if (!rooms) return null;
    const normalizedCode = code.toUpperCase().trim();
    for (const room of Object.values(rooms) as Room[]) {
      if (room.code === normalizedCode) return room;
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
