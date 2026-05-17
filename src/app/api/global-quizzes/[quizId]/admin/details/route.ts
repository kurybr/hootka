import { NextRequest, NextResponse } from "next/server";
import { getGlobalQuizEngine } from "@/lib/globalQuizEngine";
import { globalQuizErrorResponse } from "@/lib/globalQuizApi";
import { requireAuthenticatedUser, requireCreatorUser } from "@/server/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const engine = getGlobalQuizEngine();

  try {
    const user = await requireAuthenticatedUser(request);
    requireCreatorUser(user);
    const { quizId } = await params;
    const [quiz, leaderboard, userStats] = await Promise.all([
      engine.getQuizById(quizId),
      engine.getLeaderboard(quizId),
      engine.getAdminEntries(quizId, user),
    ]);

    if (!quiz) {
      throw new Error("QUIZ_NOT_FOUND");
    }

    return NextResponse.json({
      quiz,
      leaderboard,
      userStats,
    });
  } catch (error) {
    return globalQuizErrorResponse(error);
  }
}
