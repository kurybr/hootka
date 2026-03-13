import { NextRequest, NextResponse } from "next/server";
import { getGlobalQuizEngine } from "@/lib/globalQuizEngine";
import { globalQuizErrorResponse } from "@/lib/globalQuizApi";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const engine = getGlobalQuizEngine();

  try {
    const { slug } = await params;
    const payload = await engine.getPublicQuizBySlug(slug);
    return NextResponse.json(payload);
  } catch (error) {
    return globalQuizErrorResponse(error);
  }
}
