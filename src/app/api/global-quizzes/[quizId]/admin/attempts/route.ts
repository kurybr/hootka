import { NextRequest, NextResponse } from "next/server";
import { getGlobalQuizEngine } from "@/lib/globalQuizEngine";
import { globalQuizErrorResponse } from "@/lib/globalQuizApi";
import { requireAuthenticatedUser, requireCreatorUser } from "@/server/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const engine = getGlobalQuizEngine();

  try {
    const user = await requireAuthenticatedUser(request);
    requireCreatorUser(user);
    const { quizId } = await params;
    const { targetUserId, extraAttempts } = await request.json();
    const entry = await engine.grantExtraAttempts(
      quizId,
      user,
      String(targetUserId),
      Number(extraAttempts)
    );
    return NextResponse.json({ entry });
  } catch (error) {
    return globalQuizErrorResponse(error);
  }
}
