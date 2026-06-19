import { NextRequest, NextResponse } from "next/server";
import { getFirebaseEngine } from "@/lib/firebaseEngine";
import type { LiveReportCsvKind } from "@/lib/liveReportCsvExport";
import {
  buildLiveRoomReportExport,
  mapLiveRoomReportExportError,
} from "@/server/liveRoomReportExport";

export async function handleLiveRoomReportExport(
  request: NextRequest,
  roomId: string,
  kind: LiveReportCsvKind
): Promise<NextResponse> {
  const engine = getFirebaseEngine();
  if (!engine) {
    return NextResponse.json(
      { error: "Firebase não configurado" },
      { status: 503 }
    );
  }

  const hostId = request.nextUrl.searchParams.get("hostId");
  if (!hostId) {
    return NextResponse.json(
      { error: "hostId é obrigatório" },
      { status: 400 }
    );
  }

  try {
    const room = await engine.getRoom(roomId);
    if (!room) {
      throw new Error("SALA_NAO_ENCONTRADA");
    }

    const { body, filename } = buildLiveRoomReportExport(
      engine,
      room,
      hostId,
      kind
    );

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const mapped = mapLiveRoomReportExportError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
