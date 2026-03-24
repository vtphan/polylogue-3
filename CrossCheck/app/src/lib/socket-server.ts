import type { Server as SocketIOServer } from "socket.io";

// Singleton accessor for the Socket.IO server instance.
// API routes call getIO() to emit events after DB writes.
// Uses globalThis to survive Next.js hot-reloads in development.

const globalForIO = globalThis as unknown as { _io: SocketIOServer | null };

export function setIO(io: SocketIOServer) {
  globalForIO._io = io;
}

export function getIO(): SocketIOServer | null {
  return globalForIO._io || null;
}
