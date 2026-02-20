export type RoomStatus = "waiting" | "playing" | "result" | "finished";

export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  hostId: string;
  currentQuestionIndex: number;
  questionStartTimestamp: number | null;
  participants: Record<string, Participant>;
  questions: Question[];
  answers: Record<string, Record<string, Answer>>;
}

export interface Participant {
  id: string;
  name: string;
  totalScore: number;
  totalResponseTime: number;
  questionsAnswered: number;
  joinedAt: number;
  connected: boolean;
}

export interface Question {
  text: string;
  options: [string, string, string, string];
  correctOptionIndex: number;
}

export interface Answer {
  participantId: string;
  optionIndex: number;
  timestamp: number;
  responseTime: number;
  score: number;
}
