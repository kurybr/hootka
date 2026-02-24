"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupFinishedRooms = exports.onAnswerSubmitted = void 0;
const database_1 = require("firebase-functions/v2/database");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.database();
const MAX_RESPONSE_TIME = 120000;
const MAX_SCORE = 120;
exports.onAnswerSubmitted = (0, database_1.onValueCreated)("rooms/{roomId}/answers/{questionIndex}/{participantId}", async (event) => {
    const { roomId, questionIndex, participantId } = event.params;
    const answer = event.data.val();
    const roomRef = db.ref(`rooms/${roomId}`);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists())
        return;
    const room = roomSnap.val();
    const isValid = room.status === "playing" &&
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
        ? Math.round(MAX_SCORE *
            (Math.max(0, MAX_RESPONSE_TIME - answer.responseTime) /
                MAX_RESPONSE_TIME))
        : 0;
    await event.data.ref.child("score").set(score);
    const participantRef = db.ref(`rooms/${roomId}/participants/${participantId}`);
    await participantRef.transaction((current) => {
        if (!current)
            return current;
        return {
            ...current,
            totalScore: (current.totalScore || 0) + score,
            totalResponseTime: (current.totalResponseTime || 0) + answer.responseTime,
            questionsAnswered: (current.questionsAnswered || 0) + 1,
        };
    });
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
});
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
exports.cleanupFinishedRooms = (0, scheduler_1.onSchedule)("every 24 hours", async () => {
    const roomsSnap = await db.ref("rooms").get();
    if (!roomsSnap.exists())
        return;
    const rooms = roomsSnap.val();
    const now = Date.now();
    const deletions = [];
    for (const [roomId, room] of Object.entries(rooms)) {
        if (room.status !== "finished")
            continue;
        const timestamp = room.finishedAt ||
            room.questionStartTimestamp;
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
//# sourceMappingURL=index.js.map