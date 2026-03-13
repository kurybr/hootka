import { NextRequest, NextResponse } from "next/server";
import { getGlobalQuizEngine } from "@/lib/globalQuizEngine";
import { globalQuizErrorResponse } from "@/lib/globalQuizApi";
import { isValidSlug } from "@/lib/globalQuizUtils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const engine = getGlobalQuizEngine();

  try {
    const { slug } = await params;
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { error: "Slug inválido.", code: "INVALID_SLUG" },
        { status: 400 }
      );
    }
    const payload = await engine.getPublicQuizBySlug(slug);
    return NextResponse.json(payload);
  } catch (error) {
    return globalQuizErrorResponse(error);
  }
}
