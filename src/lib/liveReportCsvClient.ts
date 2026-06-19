import type { LiveReportCsvKind } from "@/lib/liveReportCsvExport";

export async function downloadRoomReportCsv(
  roomId: string,
  hostId: string,
  kind: LiveReportCsvKind
): Promise<void> {
  const path =
    kind === "ranking"
      ? `/api/firebase/rooms/${encodeURIComponent(roomId)}/export/ranking`
      : `/api/firebase/rooms/${encodeURIComponent(roomId)}/export/respostas`;

  const url = `${path}?hostId=${encodeURIComponent(hostId)}`;
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
  const filename = filenameMatch?.[1] ?? `hootka-${kind}.csv`;

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
