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
    const { code, name } = await request.json();
    if (!code?.trim() || !name?.trim()) {
      return NextResponse.json(
        { error: "Código e nome são obrigatórios" },
        { status: 400 }
      );
    }

    const { room, participant } = await engine.joinRoom(
      code.trim().toUpperCase(),
      name.trim()
    );

    return NextResponse.json({
      participantId: participant.id,
      roomId: room.id,
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "ERRO_ENTRAR_SALA";
    const message =
      code === "SALA_NAO_ENCONTRADA"
        ? "Sala não encontrada"
        : code === "SALA_JA_INICIADA"
          ? "Esta sala já está em andamento"
          : code === "NOME_DUPLICADO"
            ? "Nome já utilizado nesta sala"
            : "Erro ao entrar na sala";

    return NextResponse.json({ error: message, code }, { status: 400 });
  }
}
