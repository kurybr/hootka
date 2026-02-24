import { NextRequest, NextResponse } from "next/server";
import { getFirebaseEngine } from "@/lib/firebaseEngine";

export async function POST(request: NextRequest) {
  const engine = getFirebaseEngine();
  if (!engine) {
    return NextResponse.json(
      { error: "Firebase não configurado" },
      { status: 503 }
    );
  }

  try {
    const { questions, hostId } = await request.json();
    if (!hostId || !questions?.length) {
      return NextResponse.json(
        { error: "hostId e questions são obrigatórios" },
        { status: 400 }
      );
    }

    const room = await engine.createRoom(questions, hostId);
    return NextResponse.json({
      roomId: room.id,
      code: room.code,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao criar sala" },
      { status: 500 }
    );
  }
}
