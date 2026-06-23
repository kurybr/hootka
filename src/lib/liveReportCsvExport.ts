import type { QuizAnswerReport } from "@/lib/answerReportUtils";
import type { ParticipantAnswerReport } from "@/lib/participantAnswerReportUtils";
import type { PlayerRankingReport } from "@/lib/playerRankingReportUtils";

export const CSV_SEPARATOR = ";";
export const CSV_BOM = "\uFEFF";

export type LiveReportCsvKind =
  | "ranking"
  | "respostas"
  | "participante"
  | "todos";

export function escapeCsvField(value: string | number): string {
  const text = String(value);
  const needsQuotes =
    text.includes(CSV_SEPARATOR) ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r");
  if (!needsQuotes) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function formatCsvRow(values: Array<string | number>): string {
  return values.map(escapeCsvField).join(CSV_SEPARATOR);
}

export function optionIndexToLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export function buildPlayerRankingCsv(report: PlayerRankingReport): string {
  const lines = [
    formatCsvRow(["posicao", "nome", "pontuacao"]),
    ...report.entries.map((entry) =>
      formatCsvRow([entry.position, entry.name, entry.score])
    ),
  ];
  return lines.join("\n");
}

export function buildAnswerReportCsv(report: QuizAnswerReport): string {
  const lines = [
    formatCsvRow([
      "pergunta_numero",
      "pergunta",
      "opcao_letra",
      "opcao_texto",
      "contagem",
      "correta",
      "respostas_na_pergunta",
      "participantes",
      "taxa_acerto_pct",
    ]),
  ];

  for (const entry of report.entries) {
    const correctRate = Math.round(entry.correctRate);
    for (let i = 0; i < entry.question.options.length; i++) {
      lines.push(
        formatCsvRow([
          entry.questionIndex + 1,
          entry.question.text,
          optionIndexToLetter(i),
          entry.question.options[i],
          entry.counts[i] ?? 0,
          i === entry.question.correctOptionIndex ? "sim" : "nao",
          entry.totalAnswered,
          entry.totalSessions,
          correctRate,
        ])
      );
    }
  }

  return lines.join("\n");
}

export function buildParticipantAnswerCsv(report: ParticipantAnswerReport): string {
  const lines = [
    formatCsvRow([
      "participante",
      "codigo_sala",
      "pergunta_numero",
      "pergunta",
      "opcao_letra",
      "opcao_texto",
      "respondeu",
      "correta",
      "tempo_resposta_ms",
      "timestamp",
    ]),
    ...report.rows.map((row) =>
      formatCsvRow([
        report.participantName,
        report.roomCode,
        row.questionNumber,
        row.questionText,
        row.optionLetter,
        row.optionText,
        row.responded ? "sim" : "nao",
        row.correct === null ? "" : row.correct ? "sim" : "nao",
        row.responseTimeMs ?? "",
        row.timestamp,
      ])
    ),
  ];
  return lines.join("\n");
}

function formatDateStamp(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function slugifyCode(code?: string): string {
  if (!code) return "sala";
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 12);
}

export function buildCsvFilename(
  kind: LiveReportCsvKind,
  roomCode?: string,
  date = new Date(),
  participantSlug?: string
): string {
  const stamp = formatDateStamp(date);
  const code = slugifyCode(roomCode);

  if (kind === "ranking") {
    return `hootka-ranking-${code}-${stamp}.csv`;
  }
  if (kind === "respostas") {
    return `hootka-respostas-${code}-${stamp}.csv`;
  }
  if (kind === "participante") {
    const slug = (participantSlug ?? "participante")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    return `hootka-respostas-${slug}-${code}-${stamp}.csv`;
  }
  return `hootka-respostas-todos-${code}-${stamp}.zip`;
}

export function withCsvBom(content: string): string {
  return `${CSV_BOM}${content}`;
}
