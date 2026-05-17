"use client";

import { ref, onValue, type Unsubscribe } from "firebase/database";
import type {
  AnswerCountData,
  AnswerResultData,
  ErrorData,
  GameStatusData,
  IRealTimeProvider,
} from "./IRealTimeProvider";
import type { Answer, Participant, Question, Room } from "@/types/quiz";
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

/** RTDB pode serializar arrays como objetos com chaves "0","1",… */
function normalizeQuestionsFromRtdb(raw: unknown): Question[] | undefined {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) return raw as Question[];
  if (typeof raw === "object") {
    const obj = raw as Record<string, Question>;
    return Object.keys(obj)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => obj[k]);
  }
  return undefined;
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

type RoomParts = {
  id: string;
  code?: string;
  hostId?: string;
  status?: Room["status"];
  currentQuestionIndex?: number;
  questionStartTimestamp?: number | null;
  participants?: Record<string, Participant>;
  questions?: Question[];
  answers?: Room["answers"];
};

export class FirebaseProvider implements IRealTimeProvider {
  private _roomId: string | null = null;
  private role: "host" | "participant" | null = null;
  private participantId: string | null = null;
  private roomUnsubscribers: Unsubscribe[] = [];
  private answersUnsubscribe: Unsubscribe | null = null;
  private lastRoomState: Room | null = null;
  private _connected = false;
  private roomParts: RoomParts = { id: "" };

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

  private composeRoom(): Room | null {
    const p = this.roomParts;
    if (
      p.id &&
      p.code !== undefined &&
      p.hostId !== undefined &&
      p.status !== undefined &&
      p.currentQuestionIndex !== undefined &&
      p.questions !== undefined &&
      p.participants !== undefined
    ) {
      const answers = p.answers ?? {};
      return {
        id: p.id,
        code: p.code,
        hostId: p.hostId,
        status: p.status,
        currentQuestionIndex: p.currentQuestionIndex,
        questionStartTimestamp: p.questionStartTimestamp ?? null,
        participants: p.participants,
        questions: p.questions,
        answers,
      };
    }
    return null;
  }

  private subscribeAnswersBranch(roomId: string, questionIndex: number): void {
    const db = getFirebaseDatabase();
    if (!db) return;

    if (this.answersUnsubscribe) {
      this.answersUnsubscribe();
      this.answersUnsubscribe = null;
    }

    this.answersUnsubscribe = onValue(
      ref(db, `${ROOMS_PATH}/${roomId}/answers/${questionIndex}`),
      (snapshot) => {
        const val = snapshot.val() as Record<string, Answer> | null;
        const qKey = String(questionIndex);
        this.roomParts.answers = { [qKey]: val ?? {} };
        const room = this.composeRoom();
        if (room) this.handleRoomUpdate(room);
      }
    );
  }

  private mergeRoomParts(partial: Partial<RoomParts>): void {
    Object.assign(this.roomParts, partial);
    const room = this.composeRoom();
    if (room) this.handleRoomUpdate(room);
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

    for (const u of this.roomUnsubscribers) u();
    this.roomUnsubscribers = [];
    if (this.answersUnsubscribe) {
      this.answersUnsubscribe();
      this.answersUnsubscribe = null;
    }

    this.roomParts = { id: roomId, participants: {}, answers: {} };
    const base = `${ROOMS_PATH}/${roomId}`;

    const pushUnsub = (u: Unsubscribe) => this.roomUnsubscribers.push(u);

    pushUnsub(
      onValue(ref(db, `${base}/code`), (s) =>
        this.mergeRoomParts({ code: s.val() as string })
      )
    );
    pushUnsub(
      onValue(ref(db, `${base}/hostId`), (s) =>
        this.mergeRoomParts({ hostId: s.val() as string })
      )
    );
    pushUnsub(
      onValue(ref(db, `${base}/status`), (s) =>
        this.mergeRoomParts({ status: s.val() as Room["status"] })
      )
    );
    pushUnsub(
      onValue(ref(db, `${base}/currentQuestionIndex`), (s) => {
        const idx = typeof s.val() === "number" ? s.val() : Number(s.val()) || 0;
        this.mergeRoomParts({ currentQuestionIndex: idx });
        this.subscribeAnswersBranch(roomId, idx);
      })
    );
    pushUnsub(
      onValue(ref(db, `${base}/questionStartTimestamp`), (s) => {
        const v = s.val();
        this.mergeRoomParts({
          questionStartTimestamp:
            v === null || v === undefined ? null : Number(v),
        });
      })
    );
    pushUnsub(
      onValue(ref(db, `${base}/participants`), (s) =>
        this.mergeRoomParts({
          participants: (s.val() as Record<string, Participant>) ?? {},
        })
      )
    );
    pushUnsub(
      onValue(ref(db, `${base}/questions`), (s) => {
        const q = normalizeQuestionsFromRtdb(s.val());
        if (q) this.mergeRoomParts({ questions: q });
      })
    );
  }

  disconnect(): void {
    for (const u of this.roomUnsubscribers) u();
    this.roomUnsubscribers = [];
    if (this.answersUnsubscribe) {
      this.answersUnsubscribe();
      this.answersUnsubscribe = null;
    }
    this._roomId = null;
    this.role = null;
    this.participantId = null;
    this.lastRoomState = null;
    this.roomParts = { id: "" };
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
              correctIndex: -1,
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
