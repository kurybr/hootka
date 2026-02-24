import { onValueCreated } from "firebase-functions/v2/database";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.database();
const MAX_RESPONSE_TIME = 120000;
const MAX_SCORE = 120;

export const onAnswerSubmitted = onValueCreated(
  "rooms/{roomId}/answers/{questionIndex}/{participantId}",
  async (event) => {
    const { roomId, questionIndex, participantId } = event.params;
    const answer = event.data.val();
    const roomRef = db.ref(`rooms/${roomId}`);
    const roomSnap = await roomRef.get();

    if (!roomSnap.exists()) return;

    const room = roomSnap.val();

    const isValid =
      room.status === "playing" &&
      room.participants?.[participantId] &&
      typeof answer.responseTime === "number" &&
      answer.responseTime <= MAX_RESPONSE_TIME;

    if (!isValid) {
      await event.data.ref.remove();
      return;
    }

    const qIndex = parseInt(questionIndex, 10);
    const question = room.questions?.[qIndex];
    if (!question) {
      await event.data.ref.remove();
      return;
    }

    const isCorrect = answer.optionIndex === question.correctOptionIndex;
    const score = isCorrect
      ? Math.round(
          MAX_SCORE *
            (Math.max(0, MAX_RESPONSE_TIME - answer.responseTime) /
              MAX_RESPONSE_TIME)
        )
      : 0;

    await event.data.ref.child("score").set(score);

    const participantRef = db.ref(
      `rooms/${roomId}/participants/${participantId}`
    );
    await participantRef.transaction(
      (current: Record<string, unknown> | null) => {
        if (!current) return current;
        return {
          ...current,
          totalScore: ((current.totalScore as number) || 0) + score,
          totalResponseTime:
            ((current.totalResponseTime as number) || 0) + answer.responseTime,
          questionsAnswered:
            ((current.questionsAnswered as number) || 0) + 1,
        };
      }
    );

    const participantIds = Object.keys(room.participants || {});
    const answersSnap = await db
      .ref(`rooms/${roomId}/answers/${questionIndex}`)
      .get();
    const answers = answersSnap.val() || {};
    const answeredIds = Object.keys(answers);

    const allAnswered = participantIds.every((id) => answeredIds.includes(id));
    if (allAnswered) {
      await roomRef.child("status").set("result");
    }
  }
);

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export const cleanupFinishedRooms = onSchedule("every 24 hours", async () => {
  const roomsSnap = await db.ref("rooms").get();
  if (!roomsSnap.exists()) return;

  const rooms = roomsSnap.val();
  const now = Date.now();
  const deletions: Promise<void>[] = [];

  for (const [roomId, room] of Object.entries(rooms) as [
    string,
    Record<string, unknown>,
  ][]) {
    if (room.status !== "finished") continue;

    const timestamp =
      (room.finishedAt as number) ||
      (room.questionStartTimestamp as number | null);

    if (timestamp === null || timestamp === undefined) {
      deletions.push(db.ref(`rooms/${roomId}`).remove());
      continue;
    }

    if (now - timestamp > TWENTY_FOUR_HOURS) {
      deletions.push(db.ref(`rooms/${roomId}`).remove());
    }
  }

  await Promise.all(deletions);
});
