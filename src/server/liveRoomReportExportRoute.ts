import { NextRequest, NextResponse } from "next/server";
import { getFirebaseEngine } from "@/lib/firebaseEngine";
import {
  buildLiveRoomAllParticipantsZip,
  buildLiveRoomParticipantExport,
  buildLiveRoomReportExport,
  mapLiveRoomReportExportError,
} from "@/server/liveRoomReportExport";
import type { LiveReportCsvKind } from "@/lib/liveReportCsvExport";

function exportHeaders(filename: string, contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  };
}

function toResponseBody(body: string | Buffer): BodyInit {
  if (typeof body === "string") return body;
  return new Uint8Array(body);
}

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

    const { body, filename, contentType } = buildLiveRoomReportExport(
      engine,
      room,
      hostId,
      kind
    );

    return new NextResponse(toResponseBody(body), {
      status: 200,
      headers: exportHeaders(filename, contentType),
    });
  } catch (error) {
    const mapped = mapLiveRoomReportExportError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

export async function handleLiveRoomParticipantExport(
  request: NextRequest,
  roomId: string
): Promise<NextResponse> {
  const engine = getFirebaseEngine();
  if (!engine) {
    return NextResponse.json(
      { error: "Firebase não configurado" },
      { status: 503 }
    );
  }

  const hostId = request.nextUrl.searchParams.get("hostId");
  const participantId = request.nextUrl.searchParams.get("participantId");

  if (!hostId) {
    return NextResponse.json(
      { error: "hostId é obrigatório" },
      { status: 400 }
    );
  }
  if (!participantId) {
    return NextResponse.json(
      { error: "participantId é obrigatório" },
      { status: 400 }
    );
  }

  try {
    const room = await engine.getRoom(roomId);
    if (!room) {
      throw new Error("SALA_NAO_ENCONTRADA");
    }

    const { body, filename, contentType } = buildLiveRoomParticipantExport(
      room,
      hostId,
      participantId
    );

    return new NextResponse(toResponseBody(body), {
      status: 200,
      headers: exportHeaders(filename, contentType),
    });
  } catch (error) {
    const mapped = mapLiveRoomReportExportError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

export async function handleLiveRoomAllParticipantsExport(
  request: NextRequest,
  roomId: string
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

    const { body, filename, contentType } =
      await buildLiveRoomAllParticipantsZip(room, hostId);

    return new NextResponse(toResponseBody(body), {
      status: 200,
      headers: exportHeaders(filename, contentType),
    });
  } catch (error) {
    const mapped = mapLiveRoomReportExportError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
