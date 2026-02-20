"use client";

import { useEffect, useState } from "react";
import { useRealTime } from "@/providers/RealTimeContext";

export function useConnectionState(): {
  connected: boolean;
  inRoom: boolean;
  showReconnectingOverlay: boolean;
} {
  const provider = useRealTime();
  const [connected, setConnected] = useState(provider.isConnected);
  const [roomId, setRoomId] = useState<string | null>(provider.roomId);

  useEffect(() => {
    setConnected(provider.isConnected);
    setRoomId(provider.roomId);

    const unsubConnection = provider.onConnectionStateChange((c) => {
      setConnected(c);
      setRoomId(provider.roomId);
    });

    const unsubRoom = provider.onRoomState((room) => {
      setRoomId(room.id);
    });

    return () => {
      unsubConnection();
      unsubRoom();
    };
  }, [provider]);

  const inRoom = roomId !== null;
  const showReconnectingOverlay = inRoom && !connected;

  return { connected, inRoom, showReconnectingOverlay };
}
