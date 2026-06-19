import assert from "node:assert/strict";
import { createRequire } from "node:module";
import type { QuizAnswerReport } from "./answerReportUtils";
import type { PlayerRankingReport } from "./playerRankingReportUtils";

const require = createRequire(import.meta.url);
const {
  CSV_BOM,
  CSV_SEPARATOR,
  buildAnswerReportCsv,
  buildCsvFilename,
  buildPlayerRankingCsv,
  escapeCsvField,
  withCsvBom,
} = require("./liveReportCsvExport");

assert.equal(escapeCsvField("Ana"), "Ana");
assert.equal(escapeCsvField('Opção "A"'), '"Opção ""A"""');
assert.equal(escapeCsvField("Linha1\nLinha2"), '"Linha1\nLinha2"');
assert.equal(escapeCsvField("A;B"), '"A;B"');

const rankingReport: PlayerRankingReport = {
  totalPlayers: 2,
  playersLabel: "participantes",
  entries: [
    { id: "1", name: "Ana", score: 120, position: 1 },
    { id: "2", name: "Bruno", score: 80, position: 2 },
  ],
};

const rankingCsv = buildPlayerRankingCsv(rankingReport);
assert.ok(rankingCsv.startsWith(`posicao${CSV_SEPARATOR}nome${CSV_SEPARATOR}pontuacao`));
assert.ok(rankingCsv.includes(`1${CSV_SEPARATOR}Ana${CSV_SEPARATOR}120`));
assert.ok(rankingCsv.includes(`2${CSV_SEPARATOR}Bruno${CSV_SEPARATOR}80`));
assert.ok(!rankingCsv.includes(","));

const answerReport: QuizAnswerReport = {
  totalSessions: 2,
  questionCount: 1,
  sessionsLabel: "participantes",
  entries: [
    {
      questionIndex: 0,
      question: {
        text: "1+1=?",
        options: ["1", "2", "3"],
        correctOptionIndex: 1,
      },
      counts: [0, 2, 0],
      totalAnswered: 2,
      totalSessions: 2,
      correctRate: 100,
    },
  ],
};

const answersCsv = buildAnswerReportCsv(answerReport);
assert.ok(
  answersCsv.startsWith(
    `pergunta_numero${CSV_SEPARATOR}pergunta${CSV_SEPARATOR}opcao_letra${CSV_SEPARATOR}opcao_texto${CSV_SEPARATOR}contagem${CSV_SEPARATOR}correta${CSV_SEPARATOR}respostas_na_pergunta${CSV_SEPARATOR}participantes${CSV_SEPARATOR}taxa_acerto_pct`
  )
);
assert.ok(answersCsv.includes(`1${CSV_SEPARATOR}1+1=?${CSV_SEPARATOR}B${CSV_SEPARATOR}2${CSV_SEPARATOR}2${CSV_SEPARATOR}sim`));
assert.ok(answersCsv.includes(`${CSV_SEPARATOR}A${CSV_SEPARATOR}1${CSV_SEPARATOR}0${CSV_SEPARATOR}nao`));

const escapedQuestionReport: QuizAnswerReport = {
  ...answerReport,
  entries: [
    {
      ...answerReport.entries[0],
      question: {
        text: 'Pergunta com "aspas"; e ponto e vírgula',
        options: ["Opção; A", "2"],
        correctOptionIndex: 0,
      },
      counts: [1, 0],
    },
  ],
};

const escapedCsv = buildAnswerReportCsv(escapedQuestionReport);
assert.ok(escapedCsv.includes('"Pergunta com ""aspas""; e ponto e vírgula"'));
assert.ok(escapedCsv.includes('"Opção; A"'));

assert.equal(withCsvBom("conteudo"), `${CSV_BOM}conteudo`);

assert.equal(
  buildCsvFilename("ranking", "abc123", new Date("2026-06-18T12:00:00")),
  "hootka-ranking-ABC123-20260618.csv"
);
assert.equal(
  buildCsvFilename("respostas", "xyz", new Date("2026-01-05T12:00:00")),
  "hootka-respostas-XYZ-20260105.csv"
);

console.log("liveReportCsvExport.test.ts: ok");
