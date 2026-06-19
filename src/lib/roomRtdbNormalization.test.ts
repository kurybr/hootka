import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { normalizeAnswersFromRtdb } = require("./roomRtdbNormalization");
const { buildRoomAnswerReport } = require("./answerReportUtils");

const rtdbAnswersAsArray = [
  {
    p1: { participantId: "p1", optionIndex: 1, timestamp: 1, responseTime: 1000, score: 80 },
    p2: { participantId: "p2", optionIndex: 0, timestamp: 2, responseTime: 2000, score: 0 },
  },
  {
    p1: { participantId: "p1", optionIndex: 0, timestamp: 3, responseTime: 1500, score: 90 },
    p2: { participantId: "p2", optionIndex: 0, timestamp: 4, responseTime: 1200, score: 95 },
  },
];

const normalized = normalizeAnswersFromRtdb(rtdbAnswersAsArray);
assert.equal(Object.keys(normalized).length, 2);
assert.equal(normalized["0"]?.p1?.optionIndex, 1);
assert.equal(normalized["1"]?.p2?.optionIndex, 0);

const room = {
  id: "room-1",
  code: "ABC123",
  hostId: "host",
  status: "finished",
  currentQuestionIndex: 2,
  questionStartTimestamp: null,
  participants: {
    p1: {
      id: "p1",
      name: "Ana",
      totalScore: 170,
      totalResponseTime: 2500,
      questionsAnswered: 2,
      joinedAt: 1,
      connected: true,
    },
    p2: {
      id: "p2",
      name: "Bruno",
      totalScore: 95,
      totalResponseTime: 3200,
      questionsAnswered: 2,
      joinedAt: 2,
      connected: true,
    },
  },
  questions: [
    {
      text: "Pergunta 1",
      options: ["A", "B"],
      correctOptionIndex: 1,
    },
    {
      text: "Pergunta 2",
      options: ["X", "Y"],
      correctOptionIndex: 0,
    },
  ],
  answers: normalized,
  questionTimeLimitMs: 20000,
};

const report = buildRoomAnswerReport(room);
assert.equal(report.entries[0]?.totalAnswered, 2);
assert.equal(report.entries[0]?.counts[1], 1);
assert.equal(report.entries[0]?.counts[0], 1);
assert.equal(report.entries[0]?.correctRate, 50);
assert.equal(report.entries[1]?.totalAnswered, 2);
assert.equal(report.entries[1]?.correctRate, 100);

console.log("roomRtdbNormalization.test.ts: ok");
