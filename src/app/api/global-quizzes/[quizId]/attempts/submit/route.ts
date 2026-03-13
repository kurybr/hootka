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

    if (process.env.NODE_ENV !== "production") {
      console.log("[globalQuiz/submit] Request:", { quizId, optionIndex });
    }

    const payload = await engine.submitAnswer(user, quizId, optionIndex);

    if (process.env.NODE_ENV !== "production") {
      console.log("[globalQuiz/submit] Success:", {
        quizId,
        completed: payload.completed,
      });
    }

    return NextResponse.json(payload);
  } catch (error) {
    return globalQuizErrorResponse(error);
  }
}
