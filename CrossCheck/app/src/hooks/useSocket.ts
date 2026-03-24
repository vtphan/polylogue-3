"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket-client";
import type { Socket } from "socket.io-client";

/**
 * Base Socket.IO hook — connects and joins a session room.
 *
 * Teachers join `session:{sessionId}` (sees all groups).
 * Students join `session:{sessionId}` + `group:{groupId}`.
 */
export function useSocket(sessionId: string, groupId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    function onConnect() {
      setIsConnected(true);
      // Join rooms after (re)connection
      socket.emit("join:session", { sessionId, groupId: groupId || undefined });
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // If already connected (e.g., from a previous mount), join immediately
    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    // Heartbeat every 30s so the server knows this client is active
    const heartbeat = setInterval(() => {
      if (socket.connected) {
        socket.emit("heartbeat");
      }
    }, 30_000);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      clearInterval(heartbeat);
      // Don't disconnect the socket — other components may still use it.
      // The singleton persists across route navigations.
    };
  }, [sessionId, groupId]);

  const getSocketInstance = useCallback(() => socketRef.current, []);

  return { isConnected, getSocket: getSocketInstance };
}
