import type { QuizAnswerReport } from "@/lib/answerReportUtils";
import type { PlayerRankingReport } from "@/lib/playerRankingReportUtils";

export const CSV_SEPARATOR = ";";
export const CSV_BOM = "\uFEFF";

export type LiveReportCsvKind = "ranking" | "respostas";

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
  date = new Date()
): string {
  const prefix = kind === "ranking" ? "hootka-ranking" : "hootka-respostas";
  return `${prefix}-${slugifyCode(roomCode)}-${formatDateStamp(date)}.csv`;
}

export function withCsvBom(content: string): string {
  return `${CSV_BOM}${content}`;
}
