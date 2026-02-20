import { NextResponse } from "next/server";
import { serverMetrics } from "@/lib/serverMetrics";

const ENABLED =
  process.env.NODE_ENV !== "production" || process.env.ENABLE_METRICS === "1";

export async function GET() {
  if (!ENABLED) {
    return NextResponse.json({ error: "Métricas desabilitadas" }, { status: 404 });
  }

  const snapshot = serverMetrics.getSnapshot();
  return NextResponse.json(snapshot);
}
