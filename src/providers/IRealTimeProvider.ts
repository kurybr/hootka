import type { Participant, Question, Room } from "@/types/quiz";

export interface GameStatusData {
  status: Room["status"];
  questionIndex: number;
  timestamp: number | null;
}

export interface AnswerCountData {
  count: number;
  total: number;
}

export interface AnswerResultData {
  correct: boolean;
  score: number;
  correctIndex: number;
}

export interface ErrorData {
  message: string;
  code: string;
}

export interface IRealTimeProvider {
  connect(roomId: string, role: "host" | "participant"): void;
  disconnect(): void;
  get isConnected(): boolean;
  get roomId(): string | null;
  onConnectionStateChange(callback: (connected: boolean) => void): () => void;

  createRoom(questions: Question[]): Promise<{ roomId: string; code: string }>;
  joinRoom(
    code: string,
    name: string
  ): Promise<{ participantId: string; roomId: string }>;

  startGame(): void;
  nextQuestion(): void;
  forceResult(): void;
  endGame(): void;
  submitAnswer(optionIndex: number): void;

  onRoomState(callback: (room: Room) => void): () => void;
  onParticipantJoined(callback: (participant: Participant) => void): () => void;
  onParticipantDisconnected(
    callback: (data: { participantId: string }) => void
  ): () => void;
  onParticipantReconnected(callback: (participant: Participant) => void): () => void;
  onHostDisconnected(callback: () => void): () => void;
  onAccessDenied(callback: (data: { reason: string }) => void): () => void;
  onGameStatusChanged(callback: (data: GameStatusData) => void): () => void;
  onAnswerCount(callback: (data: AnswerCountData) => void): () => void;
  onAnswerResult(callback: (data: AnswerResultData) => void): () => void;
  onRankingUpdate(callback: (participants: Participant[]) => void): () => void;
  onError(callback: (error: ErrorData) => void): () => void;
}
