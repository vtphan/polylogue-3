import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIO } from "@/lib/socket-server";

// Student acknowledges a scaffold
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify scaffold exists and student is a member of the target group
  const scaffold = await prisma.scaffold.findUnique({
    where: { id },
    include: {
      group: {
        include: { members: { select: { userId: true } } },
      },
    },
  });

  if (!scaffold) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isMember = scaffold.group.members.some((m) => m.userId === session.user.id);
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.scaffold.update({
    where: { id },
    data: { acknowledgedAt: new Date() },
  });

  // Emit real-time event
  const io = getIO();
  if (io) {
    const event = { scaffoldId: id, groupId: scaffold.groupId, sessionId: scaffold.sessionId };
    io.to(`session:${scaffold.sessionId}`).emit("scaffold:acknowledged", event);
  }

  return NextResponse.json(updated);
}
