import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIO } from "@/lib/socket-server";

// Create annotation within a real session (Phase 2)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId, groupId, location, flawType, hinted, explanation, severity } = body;

  if (!sessionId || !groupId || !location || !flawType) {
    return NextResponse.json(
      { error: "sessionId, groupId, location, and flawType required" },
      { status: 400 }
    );
  }

  // Verify student is a member of this group
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: session.user.id },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
  }

  // Verify session is active and group is in an annotatable phase
  const classSession = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!classSession || classSession.status !== "active") {
    return NextResponse.json({ error: "Session not accepting annotations" }, { status: 400 });
  }

  // Check group phase — reviewing means annotations are locked
  const groupRecord = await prisma.group.findUnique({ where: { id: groupId } });
  if (!groupRecord || (groupRecord as unknown as { phase: string }).phase === "reviewing") {
    return NextResponse.json({ error: "Group is in reviewing phase — annotations locked" }, { status: 400 });
  }

  const annotation = await prisma.annotation.create({
    data: {
      groupId,
      userId: session.user.id,
      location,
      flawType,
      ...(hinted ? { hinted: true } : {}),
      ...(explanation ? { explanation } : {}),
      ...(severity ? { severity } : {}),
    },
  });

  // Emit real-time event
  const io = getIO();
  if (io) {
    const event = { annotation, sessionId };
    io.to(`group:${groupId}`).emit("annotation:created", event);
    io.to(`session:${sessionId}`).except(`group:${groupId}`).emit("annotation:created", event);
  }

  return NextResponse.json(annotation, { status: 201 });
}
