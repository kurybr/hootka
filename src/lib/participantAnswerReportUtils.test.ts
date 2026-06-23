import assert from "node:assert/strict";
import { createRequire } from "node:module";
import type { Room } from "@/types/quiz";

const require = createRequire(import.meta.url);
const {
  buildParticipantAnswerReport,
  slugifyParticipantName,
} = require("./participantAnswerReportUtils");
const {
  CSV_SEPARATOR,
  buildParticipantAnswerCsv,
  buildCsvFilename,
} = require("./liveReportCsvExport");

const baseRoom: Room = {
  id: "room-1",
  code: "G2GUX8",
  status: "finished",
  hostId: "host-1",
  currentQuestionIndex: 0,
  questionStartTimestamp: null,
  participants: {
    p1: {
      id: "p1",
      name: "Caio Arruda",
      totalScore: 951,
      totalResponseTime: 120000,
      questionsAnswered: 10,
      joinedAt: 1,
      connected: false,
    },
    p2: {
      id: "p2",
      name: "Erica",
      totalScore: 0,
      totalResponseTime: 0,
      questionsAnswered: 0,
      joinedAt: 2,
      connected: false,
    },
  },
  questions: [
    {
      text: "Pergunta 1?",
      options: ["A1", "B1"],
      correctOptionIndex: 0,
    },
    {
      text: 'Pergunta com "aspas"; e ponto e vírgula',
      options: ["Opção; A", "B2"],
      correctOptionIndex: 1,
    },
  ],
  answers: {
    "0": {
      p1: {
        participantId: "p1",
        optionIndex: 0,
        timestamp: 1_718_828_308_600,
        responseTime: 5500,
        score: 100,
      },
    },
    "1": {
      p1: {
        participantId: "p1",
        optionIndex: 0,
        timestamp: 1_718_828_363_505,
        responseTime: 12000,
        score: 0,
      },
    },
  },
  questionTimeLimitMs: 120000,
};

const report = buildParticipantAnswerReport(baseRoom, "p1");
assert.equal(report.participantName, "Caio Arruda");
assert.equal(report.roomCode, "G2GUX8");
assert.equal(report.rows.length, 2);
assert.equal(report.rows[0]?.responded, true);
assert.equal(report.rows[0]?.optionLetter, "A");
assert.equal(report.rows[0]?.correct, true);
assert.equal(report.rows[0]?.responseTimeMs, 5500);
assert.equal(report.rows[0]?.timestamp, new Date(1_718_828_308_600).toISOString());
assert.equal(report.rows[1]?.responded, true);
assert.equal(report.rows[1]?.correct, false);
assert.equal(report.rows[1]?.responseTimeMs, 12000);

const emptyReport = buildParticipantAnswerReport(baseRoom, "p2");
assert.equal(emptyReport.rows[0]?.responded, false);
assert.equal(emptyReport.rows[0]?.correct, null);
assert.equal(emptyReport.rows[0]?.responseTimeMs, null);
assert.equal(emptyReport.rows[0]?.timestamp, "");

assert.throws(
  () => buildParticipantAnswerReport(baseRoom, "missing"),
  /PARTICIPANTE_NAO_ENCONTRADO/
);

const csv = buildParticipantAnswerCsv(report);
assert.ok(
  csv.startsWith(
    `participante${CSV_SEPARATOR}codigo_sala${CSV_SEPARATOR}pergunta_numero${CSV_SEPARATOR}pergunta${CSV_SEPARATOR}opcao_letra${CSV_SEPARATOR}opcao_texto${CSV_SEPARATOR}respondeu${CSV_SEPARATOR}correta${CSV_SEPARATOR}tempo_resposta_ms${CSV_SEPARATOR}timestamp`
  )
);
assert.ok(csv.includes(`Caio Arruda${CSV_SEPARATOR}G2GUX8${CSV_SEPARATOR}1${CSV_SEPARATOR}Pergunta 1?`));
assert.ok(csv.includes(`${CSV_SEPARATOR}5500${CSV_SEPARATOR}`));
assert.ok(csv.includes('"Pergunta com ""aspas""; e ponto e vírgula"'));

assert.equal(slugifyParticipantName("Caio Arruda"), "caio-arruda");
assert.equal(
  buildCsvFilename("participante", "G2GUX8", new Date("2026-06-18T12:00:00"), "caio-arruda"),
  "hootka-respostas-caio-arruda-G2GUX8-20260618.csv"
);
assert.equal(
  buildCsvFilename("todos", "G2GUX8", new Date("2026-06-18T12:00:00")),
  "hootka-respostas-todos-G2GUX8-20260618.zip"
);

console.log("participantAnswerReportUtils.test.ts: ok");
