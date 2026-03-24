import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { parse } from "cookie";
import { setIO } from "./src/lib/socket-server";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// In-memory connection tracking: socketId → user/session info
interface ConnectedUser {
  userId: string;
  role: string;
  sessionId: string;
  groupId: string | null; // null for teachers
  lastActivity: Date;
}
const connections = new Map<string, ConnectedUser>();

// Expose for API routes to query connection status
const globalForConnections = globalThis as unknown as {
  _socketConnections: Map<string, ConnectedUser>;
};

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer(httpServer, {
    path: "/socket.io/",
    cors: {
      origin: dev ? "http://localhost:3000" : false,
      credentials: true,
    },
    // Brief disconnections are buffered automatically
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    },
  });

  // Store the IO instance globally so API routes can emit events
  setIO(io);
  globalForConnections._socketConnections = connections;

  // ---- Authentication middleware ----
  // NextAuth v5 stores the JWT in an httpOnly cookie.
  // The browser sends cookies during the WebSocket handshake automatically.
  io.use(async (socket, nextMiddleware) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) {
        return nextMiddleware(new Error("No cookies — not authenticated"));
      }

      const cookies = parse(cookieHeader);
      // NextAuth v5 beta cookie names — salt must match the cookie name
      const cookieName = cookies["__Secure-authjs.session-token"]
        ? "__Secure-authjs.session-token"
        : "authjs.session-token";
      const token = cookies[cookieName];

      if (!token) {
        return nextMiddleware(new Error("No session token"));
      }

      // Decode the JWT using NextAuth's own decode function
      const { decode } = await import("@auth/core/jwt");
      const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
      if (!secret) {
        return nextMiddleware(new Error("Auth secret not configured"));
      }

      const decoded = await decode({ token, secret, salt: cookieName });
      if (!decoded || !decoded.id) {
        return nextMiddleware(new Error("Invalid token"));
      }

      // Validate role is present
      if (!decoded.role) {
        return nextMiddleware(new Error("Token missing role"));
      }

      // Attach user info to the socket
      socket.data.userId = decoded.id as string;
      socket.data.role = decoded.role as string;
      socket.data.name = decoded.name as string;
      nextMiddleware();
    } catch (err) {
      console.error("[Socket.IO] Auth error:", err);
      nextMiddleware(new Error("Authentication failed"));
    }
  });

  // ---- Connection handler ----
  io.on("connection", (socket) => {
    const { userId, role, name } = socket.data;
    console.log(`[Socket.IO] Connected: ${name} (${role}) [${socket.id}]`);

    // Join a session room with authorization.
    // Teachers must own the session. Students must be a member of the group.
    socket.on("join:session", async (data: { sessionId: string; groupId?: string }) => {
      const { sessionId, groupId } = data;

      try {
        const { prisma } = await import("./src/lib/db");

        // Validate session exists
        const session = await prisma.session.findUnique({
          where: { id: sessionId },
          select: { id: true, teacherId: true },
        });
        if (!session) return;

        // Teachers must own the session
        if (role === "teacher" && session.teacherId !== userId) return;

        // Students must be a member of the specified group
        if (role === "student") {
          if (!groupId) return;
          const membership = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
          });
          if (!membership) return;
        }

        // Leave old rooms before joining new ones
        for (const room of socket.rooms) {
          if (room !== socket.id && (room.startsWith("session:") || room.startsWith("group:"))) {
            socket.leave(room);
          }
        }

        socket.join(`session:${sessionId}`);
        if (groupId) {
          socket.join(`group:${groupId}`);
        }

        // Track this connection
        connections.set(socket.id, {
          userId,
          role,
          sessionId,
          groupId: groupId || null,
          lastActivity: new Date(),
        });

        // Notify the session room about the connection
        io.to(`session:${sessionId}`).emit("user:connected", {
          userId,
          role,
          groupId: groupId || null,
          socketId: socket.id,
        });

        // Send current connection roster to the newly joined socket (for teachers)
        if (role === "teacher") {
          const roster: { userId: string; groupId: string | null; role: string }[] = [];
          for (const [, conn] of connections) {
            if (conn.sessionId === sessionId) {
              roster.push({
                userId: conn.userId,
                groupId: conn.groupId,
                role: conn.role,
              });
            }
          }
          socket.emit("connection:roster", roster);
        }
      } catch (err) {
        console.error("[Socket.IO] join:session error:", err);
      }
    });

    // Heartbeat — students send this periodically to update lastActivity
    socket.on("heartbeat", () => {
      const conn = connections.get(socket.id);
      if (conn) {
        conn.lastActivity = new Date();
      }
    });

    // Cleanup on disconnect
    socket.on("disconnect", () => {
      const conn = connections.get(socket.id);
      if (conn) {
        io.to(`session:${conn.sessionId}`).emit("user:disconnected", {
          userId: conn.userId,
          groupId: conn.groupId,
          socketId: socket.id,
        });
        connections.delete(socket.id);
      }
      console.log(`[Socket.IO] Disconnected: ${name} [${socket.id}]`);
    });
  });

  httpServer.listen(port, () => {
    console.log(
      `> Server listening at http://localhost:${port} as ${
        dev ? "development" : process.env.NODE_ENV
      }`
    );
  });
});
