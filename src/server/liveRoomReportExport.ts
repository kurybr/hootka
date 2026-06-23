import JSZip from "jszip";
import { buildRoomAnswerReport } from "@/lib/answerReportUtils";
import {
  buildAnswerReportCsv,
  buildCsvFilename,
  buildParticipantAnswerCsv,
  buildPlayerRankingCsv,
  withCsvBom,
  type LiveReportCsvKind,
} from "@/lib/liveReportCsvExport";
import {
  buildParticipantAnswerReport,
  slugifyParticipantName,
} from "@/lib/participantAnswerReportUtils";
import { buildLivePlayerRankingReport } from "@/lib/playerRankingReportUtils";
import type { GameEngine } from "@/server/GameEngine";
import type { Room } from "@/types/quiz";

export interface LiveRoomReportExportResult {
  body: string | Buffer;
  filename: string;
  contentType: string;
}

function assertHostCanExport(room: Room, hostId: string): void {
  if (room.hostId !== hostId) {
    throw new Error("APENAS_HOST_PODE_EXPORTAR");
  }
  if (room.status !== "finished") {
    throw new Error("JOGO_NAO_ENCERRADO");
  }
}

export async function buildLiveRoomAllParticipantsZip(
  room: Room,
  hostId: string
): Promise<LiveRoomReportExportResult> {
  assertHostCanExport(room, hostId);

  const participants = Object.values(room.participants ?? {});
  if (participants.length === 0) {
    throw new Error("RELATORIO_VAZIO");
  }

  const zip = new JSZip();
  const usedNames = new Map<string, number>();

  for (const participant of participants) {
    const report = buildParticipantAnswerReport(room, participant.id);
    const baseSlug = slugifyParticipantName(report.participantName);
    const count = (usedNames.get(baseSlug) ?? 0) + 1;
    usedNames.set(baseSlug, count);
    const slug = count > 1 ? `${baseSlug}-${count}` : baseSlug;
    const filename = buildCsvFilename(
      "participante",
      room.code,
      new Date(),
      slug
    );
    zip.file(filename, withCsvBom(buildParticipantAnswerCsv(report)));
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  return {
    body: buffer,
    filename: buildCsvFilename("todos", room.code),
    contentType: "application/zip",
  };
}

export function buildLiveRoomReportExport(
  engine: GameEngine,
  room: Room,
  hostId: string,
  kind: LiveReportCsvKind
): LiveRoomReportExportResult {
  assertHostCanExport(room, hostId);

  if (kind === "ranking") {
    const ranked = engine.getRanking(room).map((participant, index) => ({
      ...participant,
      position: index + 1,
    }));
    const report = buildLivePlayerRankingReport(ranked);
    if (report.totalPlayers === 0) {
      throw new Error("RELATORIO_VAZIO");
    }
    return {
      body: withCsvBom(buildPlayerRankingCsv(report)),
      filename: buildCsvFilename("ranking", room.code),
      contentType: "text/csv; charset=utf-8",
    };
  }

  const report = buildRoomAnswerReport(room);
  if (report.totalSessions === 0) {
    throw new Error("RELATORIO_VAZIO");
  }
  return {
    body: withCsvBom(buildAnswerReportCsv(report)),
    filename: buildCsvFilename("respostas", room.code),
    contentType: "text/csv; charset=utf-8",
  };
}

export function mapLiveRoomReportExportError(error: unknown): {
  status: number;
  message: string;
} {
  const code = error instanceof Error ? error.message : "ERRO_DESCONHECIDO";

  switch (code) {
    case "SALA_NAO_ENCONTRADA":
      return { status: 404, message: "Sala não encontrada." };
    case "PARTICIPANTE_NAO_ENCONTRADO":
      return { status: 404, message: "Participante não encontrado." };
    case "APENAS_HOST_PODE_EXPORTAR":
      return { status: 403, message: "Apenas o host pode exportar relatórios." };
    case "JOGO_NAO_ENCERRADO":
      return {
        status: 400,
        message: "O relatório só pode ser exportado após o jogo ser encerrado.",
      };
    case "RELATORIO_VAZIO":
      return { status: 400, message: "Não há dados para exportar." };
    default:
      return { status: 400, message: "Não foi possível exportar o relatório." };
  }
}
