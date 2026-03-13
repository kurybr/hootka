import { NextRequest, NextResponse } from "next/server";
import { getGlobalQuizEngine } from "@/lib/globalQuizEngine";
import { globalQuizErrorResponse } from "@/lib/globalQuizApi";
import {
  requireAuthenticatedUser,
  requireVerifiedEmail,
} from "@/server/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const engine = getGlobalQuizEngine();

  try {
    const user = await requireAuthenticatedUser(request);
    const { quizId } = await params;
    const quiz = await engine.getQuizById(quizId);
    if (!quiz) {
      throw new Error("QUIZ_NOT_FOUND");
    }
    if (quiz.createdBy !== user.uid && user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    return NextResponse.json({ quiz });
  } catch (error) {
    return globalQuizErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const engine = getGlobalQuizEngine();

  try {
    const user = await requireAuthenticatedUser(request);
    requireVerifiedEmail(user);
    const body = await request.json();
    const { quizId } = await params;
    const quiz = await engine.updateQuiz(quizId, user, body);
    return NextResponse.json({ quiz });
  } catch (error) {
    return globalQuizErrorResponse(error);
  }
}
