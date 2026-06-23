import { NextRequest } from "next/server";
import { handleLiveRoomParticipantExport } from "@/server/liveRoomReportExportRoute";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  return handleLiveRoomParticipantExport(request, roomId);
}
