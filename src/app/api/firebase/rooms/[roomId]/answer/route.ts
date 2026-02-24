import { NextRequest, NextResponse } from "next/server";
import { getFirebaseEngine } from "@/lib/firebaseEngine";
import { FirebaseStore } from "@/server/FirebaseStore";

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
  const { participantId, optionIndex } = await request.json();

  if (!participantId || typeof optionIndex !== "number") {
    return NextResponse.json(
      { error: "participantId e optionIndex são obrigatórios" },
      { status: 400 }
    );
  }

  const store = new FirebaseStore();
  const room = await store.getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const questionIndex = room.currentQuestionIndex;

  try {
    const result = await engine.submitAnswer(
      roomId,
      participantId,
      questionIndex,
      optionIndex
    );

    const updatedRoom = await store.getRoom(roomId);
    if (result.shouldTransitionToResult && updatedRoom) {
      await engine.transitionToResult(roomId);
    }

    return NextResponse.json({
      correct: result.correct,
      score: result.score,
      correctIndex: result.correctIndex,
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "ERRO_RESPOSTA";
    const message =
      code === "RESPOSTA_DUPLICADA"
        ? "Você já respondeu esta pergunta"
        : code === "TEMPO_ESGOTADO"
          ? "Tempo esgotado"
          : "Erro ao enviar resposta";

    return NextResponse.json({ error: message, code }, { status: 400 });
  }
}
