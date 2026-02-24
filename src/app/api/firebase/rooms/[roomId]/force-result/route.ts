import { NextRequest, NextResponse } from "next/server";
import { getFirebaseEngine } from "@/lib/firebaseEngine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const engine = getFirebaseEngine();
  if (!engine) {
    return NextResponse.json(
      { error: "Firebase não configurado" },
      { status: 503 }
    );
  }

  const { roomId } = await params;
  const { hostId } = await request.json();

  if (!hostId) {
    return NextResponse.json(
      { error: "hostId é obrigatório" },
      { status: 400 }
    );
  }

  try {
    await engine.forceResult(roomId, hostId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erro ao encerrar pergunta",
      },
      { status: 400 }
    );
  }
}
