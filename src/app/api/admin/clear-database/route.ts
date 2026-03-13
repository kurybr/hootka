import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser, requireAdmin } from "@/server/auth";
import { clearEntireDatabase } from "@/server/clearDatabase";
import { globalQuizErrorResponse } from "@/lib/globalQuizApi";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    requireAdmin(user);

    const result = await clearEntireDatabase();
    return NextResponse.json({
      ok: true,
      cleared: result.cleared,
    });
  } catch (error) {
    return globalQuizErrorResponse(error);
  }
}
