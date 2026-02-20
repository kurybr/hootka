import type { Answer, Participant, Room } from "@/types/quiz";
import type { IGameStore } from "./IGameStore";

export class InMemoryStore implements IGameStore {
  private rooms = new Map<string, Room>();

  async createRoom(room: Room): Promise<void> {
    this.rooms.set(room.id, { ...room });
  }

  async getRoom(roomId: string): Promise<Room | null> {
    return this.rooms.get(roomId) ?? null;
  }

  async getRoomByCode(code: string): Promise<Room | null> {
    const normalizedCode = code.toUpperCase().trim();
    for (const room of this.rooms.values()) {
      if (room.code === normalizedCode) return room;
    }
    return null;
  }

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;
    Object.assign(room, updates);
  }

  async addParticipant(
    roomId: string,
    participant: Participant
  ): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.participants[participant.id] = { ...participant };
  }

  async addAnswer(
    roomId: string,
    questionIndex: number,
    answer: Answer
  ): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const qKey = String(questionIndex);
    if (!room.answers[qKey]) {
      room.answers[qKey] = {};
    }
    room.answers[qKey][answer.participantId] = { ...answer };
  }

  async updateParticipantScore(
    roomId: string,
    participantId: string,
    scoreIncrement: number,
    responseTime: number
  ): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const participant = room.participants[participantId];
    if (!participant) return;
    participant.totalScore += scoreIncrement;
    participant.totalResponseTime += responseTime;
    participant.questionsAnswered += 1;
  }

  async deleteRoom(roomId: string): Promise<void> {
    this.rooms.delete(roomId);
  }
}
