import { NextRequest, NextResponse } from "next/server";
import { getGlobalQuizEngine } from "@/lib/globalQuizEngine";
import { globalQuizErrorResponse } from "@/lib/globalQuizApi";
import {
  requireAuthenticatedUser,
  requireVerifiedEmail,
} from "@/server/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const engine = getGlobalQuizEngine();

  try {
    const user = await requireAuthenticatedUser(request);
    requireVerifiedEmail(user);
    const { quizId } = await params;
    const body = await request.json().catch(() => ({}));
    const optionIndex = typeof body?.optionIndex === "number" ? body.optionIndex : null;

    console.log("[globalQuiz/submit] Request:", {
      quizId,
      optionIndex,
      userId: user.uid,
    });

    const payload = await engine.submitAnswer(user, quizId, optionIndex);

    console.log("[globalQuiz/submit] Success:", {
      quizId,
      attemptId: payload.attempt.id,
      completed: payload.completed,
      totalScore: payload.attempt.totalScore,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return globalQuizErrorResponse(error);
  }
}
