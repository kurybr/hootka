import { NextRequest, NextResponse } from "next/server";
import { getGlobalQuizEngine } from "@/lib/globalQuizEngine";
import { globalQuizErrorResponse } from "@/lib/globalQuizApi";
import {
  requireAuthenticatedUser,
  requireVerifiedEmail,
} from "@/server/auth";

export async function GET(request: NextRequest) {
  const engine = getGlobalQuizEngine();
  const mine = request.nextUrl.searchParams.get("mine");

  try {
    if (mine === "1") {
      const user = await requireAuthenticatedUser(request);
      return NextResponse.json({
        quizzes: await engine.listQuizzesByOwner(user.uid),
      });
    }

    return NextResponse.json({
      quizzes: await engine.listPublishedQuizzes(),
    });
  } catch (error) {
    return globalQuizErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const engine = getGlobalQuizEngine();

  try {
    const user = await requireAuthenticatedUser(request);
    requireVerifiedEmail(user);
    const body = await request.json();
    const quiz = await engine.createQuiz(user, body);
    return NextResponse.json({ quiz });
  } catch (error) {
    return globalQuizErrorResponse(error);
  }
}
