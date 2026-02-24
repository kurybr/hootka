"use client";

import { ref, onValue, off, type Unsubscribe } from "firebase/database";
import type {
  AnswerCountData,
  AnswerResultData,
  ErrorData,
  GameStatusData,
  IRealTimeProvider,
} from "./IRealTimeProvider";
import type { Participant, Question, Room } from "@/types/quiz";
import { getFirebaseDatabase, ROOMS_PATH } from "@/lib/firebase";

const HOST_ID_KEY = "quiz_hostId";
const PARTICIPANT_ID_KEY = "quiz_participantId";

function getOrCreateHostId(): string {
  if (typeof window === "undefined") return "";
  let hostId = localStorage.getItem(HOST_ID_KEY);
  if (!hostId) {
    hostId = crypto.randomUUID();
    localStorage.setItem(HOST_ID_KEY, hostId);
  }
  return hostId;
}

function getRanking(room: Room): Participant[] {
  const participants = room.participants ?? {};
  return Object.values(participants).sort((a, b) => {
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

function getAnswerCount(
  room: Room,
  questionIndex: number
): { count: number; total: number } {
  const participants = room.participants ?? {};
  const answers = room.answers ?? {};
  const total = Object.keys(participants).length;
  const qKey = String(questionIndex);
  const count = Object.keys(answers[qKey] ?? {}).length;
  return { count, total };
}

async function apiFetch(
  url: string,
  body: Record<string, unknown>
): Promise<Response> {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return fetch(`${base}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export class FirebaseProvider implements IRealTimeProvider {
  private _roomId: string | null = null;
  private role: "host" | "participant" | null = null;
  private participantId: string | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private lastRoomState: Room | null = null;
  private _connected = false;

  private roomStateListeners: Set<(room: Room) => void> = new Set();
  private participantJoinedListeners: Set<(p: Participant) => void> =
    new Set();
  private gameStatusListeners: Set<(data: GameStatusData) => void> = new Set();
  private answerCountListeners: Set<(data: AnswerCountData) => void> =
    new Set();
  private answerResultListeners: Set<(data: AnswerResultData) => void> =
    new Set();
  private rankingListeners: Set<(participants: Participant[]) => void> =
    new Set();
  private errorListeners: Set<(error: ErrorData) => void> = new Set();
  private participantDisconnectedListeners: Set<
    (data: { participantId: string }) => void
  > = new Set();
  private participantReconnectedListeners: Set<(p: Participant) => void> =
    new Set();
  private hostDisconnectedListeners: Set<() => void> = new Set();
  private accessDeniedListeners: Set<(data: { reason: string }) => void> =
    new Set();
  private connectionStateListeners: Set<(connected: boolean) => void> =
    new Set();

  private emitError(message: string, code: string): void {
    const data: ErrorData = { message, code };
    this.errorListeners.forEach((cb) => cb(data));
  }

  private handleRoomUpdate(room: Room | null): void {
    if (!room) return;

    const prev = this.lastRoomState;
    this.lastRoomState = room;

    this.roomStateListeners.forEach((cb) => cb(room));
    this.rankingListeners.forEach((cb) => cb(getRanking(room)));

    this.gameStatusListeners.forEach((cb) =>
      cb({
        status: room.status,
        questionIndex: room.currentQuestionIndex,
        timestamp: room.questionStartTimestamp,
      })
    );

    const { count, total } = getAnswerCount(room, room.currentQuestionIndex);
    this.answerCountListeners.forEach((cb) => cb({ count, total }));

    const currParticipants = room.participants ?? {};
    const prevParticipants = prev?.participants ?? {};

    if (prev) {
      const prevParticipantIds = new Set(Object.keys(prevParticipants));
      const currParticipantIds = new Set(Object.keys(currParticipants));

      for (const id of currParticipantIds) {
        if (!prevParticipantIds.has(id)) {
          const p = currParticipants[id];
          if (p) this.participantJoinedListeners.forEach((cb) => cb(p));
        } else {
          const prevP = prevParticipants[id];
          const currP = currParticipants[id];
          if (prevP?.connected && !currP?.connected) {
            this.participantDisconnectedListeners.forEach((cb) =>
              cb({ participantId: id })
            );
          } else if (!prevP?.connected && currP?.connected) {
            if (currP)
              this.participantReconnectedListeners.forEach((cb) => cb(currP));
          }
        }
      }
    } else {
      for (const p of Object.values(currParticipants)) {
        this.participantJoinedListeners.forEach((cb) => cb(p));
      }
    }
  }

  connect(roomId: string, role: "host" | "participant"): void {
    this._roomId = roomId;
    this.role = role;
    this._connected = true;
    this.connectionStateListeners.forEach((cb) => cb(true));

    const db = getFirebaseDatabase();
    if (!db) {
      this.emitError("Firebase não configurado", "FIREBASE_NAO_CONFIGURADO");
      return;
    }

    this.unsubscribe = onValue(
      ref(db, `${ROOMS_PATH}/${roomId}`),
      (snapshot) => {
        const data = snapshot.val();
        this.handleRoomUpdate(data ? (data as Room) : null);
      },
      () => {
        this._connected = false;
        this.connectionStateListeners.forEach((cb) => cb(false));
      }
    );
  }

  disconnect(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this._roomId = null;
    this.role = null;
    this.participantId = null;
    this.lastRoomState = null;
    this._connected = false;
    this.connectionStateListeners.forEach((cb) => cb(false));
  }

  async createRoom(questions: Question[]): Promise<{
    roomId: string;
    code: string;
  }> {
    const hostId = getOrCreateHostId();
    const res = await apiFetch("/api/firebase/rooms/create", {
      questions,
      hostId,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "Erro ao criar sala");
    }

    this._roomId = data.roomId;
    this.role = "host";
    this.connect(data.roomId, "host");

    return { roomId: data.roomId, code: data.code };
  }

  async joinRoom(
    code: string,
    name: string
  ): Promise<{ participantId: string; roomId: string }> {
    const res = await apiFetch("/api/firebase/rooms/join", { code, name });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "Erro ao entrar na sala");
    }

    this._roomId = data.roomId;
    this.role = "participant";
    this.participantId = data.participantId;
    localStorage.setItem(PARTICIPANT_ID_KEY, data.participantId);
    this.connect(data.roomId, "participant");

    return {
      participantId: data.participantId,
      roomId: data.roomId,
    };
  }

  startGame(): void {
    const roomId = this._roomId;
    const hostId = getOrCreateHostId();
    if (!roomId) return;

    apiFetch(`/api/firebase/rooms/${roomId}/start`, { hostId }).then(
      (res) => {
        if (!res.ok) {
          res.json().then((d) => this.emitError(d.error ?? "Erro", "ERRO"));
        }
      },
      () => this.emitError("Servidor indisponível", "ERRO")
    );
  }

  nextQuestion(): void {
    const roomId = this._roomId;
    const hostId = getOrCreateHostId();
    if (!roomId) return;

    apiFetch(`/api/firebase/rooms/${roomId}/next-question`, { hostId }).then(
      (res) => {
        if (!res.ok) {
          res.json().then((d) => this.emitError(d.error ?? "Erro", "ERRO"));
        }
      },
      () => this.emitError("Servidor indisponível", "ERRO")
    );
  }

  forceResult(): void {
    const roomId = this._roomId;
    const hostId = getOrCreateHostId();
    if (!roomId) return;

    apiFetch(`/api/firebase/rooms/${roomId}/force-result`, { hostId }).then(
      (res) => {
        if (!res.ok) {
          res.json().then((d) => this.emitError(d.error ?? "Erro", "ERRO"));
        }
      },
      () => this.emitError("Servidor indisponível", "ERRO")
    );
  }

  endGame(): void {
    const roomId = this._roomId;
    const hostId = getOrCreateHostId();
    if (!roomId) return;

    apiFetch(`/api/firebase/rooms/${roomId}/end`, { hostId }).then(
      (res) => {
        if (!res.ok) {
          res.json().then((d) => this.emitError(d.error ?? "Erro", "ERRO"));
        }
      },
      () => this.emitError("Servidor indisponível", "ERRO")
    );
  }

  submitAnswer(optionIndex: number): void {
    const roomId = this._roomId;
    const participantId =
      this.participantId ?? localStorage.getItem(PARTICIPANT_ID_KEY);
    if (!roomId || !participantId) return;

    apiFetch(`/api/firebase/rooms/${roomId}/answer`, {
      participantId,
      optionIndex,
    }).then(
      async (res) => {
        const data = await res.json();
        if (res.ok) {
          this.answerResultListeners.forEach((cb) =>
            cb({
              correct: data.correct,
              score: data.score,
              correctIndex: data.correctIndex,
            })
          );
        } else {
          this.emitError(data.error ?? "Erro ao enviar resposta", data.code);
        }
      },
      () => this.emitError("Erro ao enviar resposta", "ERRO")
    );
  }

  get isConnected(): boolean {
    return this._connected;
  }

  get roomId(): string | null {
    return this._roomId;
  }

  onRoomState(callback: (room: Room) => void): () => void {
    this.roomStateListeners.add(callback);
    if (this.lastRoomState) callback(this.lastRoomState);
    return () => this.roomStateListeners.delete(callback);
  }

  onParticipantJoined(callback: (participant: Participant) => void): () => void {
    this.participantJoinedListeners.add(callback);
    return () => this.participantJoinedListeners.delete(callback);
  }

  onParticipantDisconnected(
    callback: (data: { participantId: string }) => void
  ): () => void {
    this.participantDisconnectedListeners.add(callback);
    return () => this.participantDisconnectedListeners.delete(callback);
  }

  onParticipantReconnected(callback: (participant: Participant) => void): () => void {
    this.participantReconnectedListeners.add(callback);
    return () => this.participantReconnectedListeners.delete(callback);
  }

  onHostDisconnected(callback: () => void): () => void {
    this.hostDisconnectedListeners.add(callback);
    return () => this.hostDisconnectedListeners.delete(callback);
  }

  onAccessDenied(callback: (data: { reason: string }) => void): () => void {
    this.accessDeniedListeners.add(callback);
    return () => this.accessDeniedListeners.delete(callback);
  }

  onGameStatusChanged(callback: (data: GameStatusData) => void): () => void {
    this.gameStatusListeners.add(callback);
    return () => this.gameStatusListeners.delete(callback);
  }

  onAnswerCount(callback: (data: AnswerCountData) => void): () => void {
    this.answerCountListeners.add(callback);
    return () => this.answerCountListeners.delete(callback);
  }

  onAnswerResult(callback: (data: AnswerResultData) => void): () => void {
    this.answerResultListeners.add(callback);
    return () => this.answerResultListeners.delete(callback);
  }

  onRankingUpdate(callback: (participants: Participant[]) => void): () => void {
    this.rankingListeners.add(callback);
    return () => this.rankingListeners.delete(callback);
  }

  onError(callback: (error: ErrorData) => void): () => void {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }

  onConnectionStateChange(callback: (connected: boolean) => void): () => void {
    callback(this._connected);
    this.connectionStateListeners.add(callback);
    return () => this.connectionStateListeners.delete(callback);
  }
}
