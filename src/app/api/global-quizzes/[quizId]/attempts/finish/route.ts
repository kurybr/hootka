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
    const attempt = await engine.finishAttempt(user, quizId);
    return NextResponse.json({ attempt });
  } catch (error) {
    return globalQuizErrorResponse(error);
  }
}
