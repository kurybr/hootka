import type { LiveReportCsvKind } from "@/lib/liveReportCsvExport";

async function downloadExportFile(
  url: string,
  fallbackFilename: string
): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    let message = "Não foi possível exportar o relatório.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // resposta não é JSON (ex.: CSV parcial)
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filenameMatch = disposition.match(/filename="([^"]+)"/i);
  const filename = filenameMatch?.[1] ?? fallbackFilename;

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadRoomReportCsv(
  roomId: string,
  hostId: string,
  kind: Extract<LiveReportCsvKind, "ranking" | "respostas">
): Promise<void> {
  const path =
    kind === "ranking"
      ? `/api/firebase/rooms/${encodeURIComponent(roomId)}/export/ranking`
      : `/api/firebase/rooms/${encodeURIComponent(roomId)}/export/respostas`;

  const url = `${path}?hostId=${encodeURIComponent(hostId)}`;
  await downloadExportFile(url, `hootka-${kind}.csv`);
}

export async function downloadParticipantAnswerCsv(
  roomId: string,
  hostId: string,
  participantId: string
): Promise<void> {
  const path = `/api/firebase/rooms/${encodeURIComponent(roomId)}/export/participante`;
  const url = `${path}?hostId=${encodeURIComponent(hostId)}&participantId=${encodeURIComponent(participantId)}`;
  await downloadExportFile(url, "hootka-respostas-participante.csv");
}

export async function downloadAllParticipantsZip(
  roomId: string,
  hostId: string
): Promise<void> {
  const path = `/api/firebase/rooms/${encodeURIComponent(roomId)}/export/todos`;
  const url = `${path}?hostId=${encodeURIComponent(hostId)}`;
  await downloadExportFile(url, "hootka-respostas-todos.zip");
}
