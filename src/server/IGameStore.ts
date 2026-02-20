import type { Answer, Participant, Room } from "../types/quiz";

export interface IGameStore {
  createRoom(room: Room): Promise<void>;
  getRoom(roomId: string): Promise<Room | null>;
  getRoomByCode(code: string): Promise<Room | null>;
  updateRoom(roomId: string, updates: Partial<Room>): Promise<void>;
  addParticipant(roomId: string, participant: Participant): Promise<void>;
  updateParticipantConnection(
    roomId: string,
    participantId: string,
    connected: boolean
  ): Promise<void>;
  addAnswer(
    roomId: string,
    questionIndex: number,
    answer: Answer
  ): Promise<void>;
  updateParticipantScore(
    roomId: string,
    participantId: string,
    scoreIncrement: number,
    responseTime: number
  ): Promise<void>;
  deleteRoom(roomId: string): Promise<void>;
}
