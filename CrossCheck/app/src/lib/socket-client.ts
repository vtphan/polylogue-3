"use client";

import { io, Socket } from "socket.io-client";

// Singleton Socket.IO client — shared across all components.
// No URL needed because the Socket.IO server is on the same host/port.

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: "/socket.io/",
      autoConnect: true,
      withCredentials: true, // send cookies for auth
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
