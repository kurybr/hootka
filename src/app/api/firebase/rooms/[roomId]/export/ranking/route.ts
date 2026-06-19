import { NextRequest } from "next/server";
import { handleLiveRoomReportExport } from "@/server/liveRoomReportExportRoute";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  return handleLiveRoomReportExport(request, roomId, "ranking");
}
