import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIO } from "@/lib/socket-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Only allow deleting own annotations
  const annotation = await prisma.annotation.findUnique({
    where: { id },
    include: {
      group: {
        include: { session: { select: { id: true, status: true } } },
      },
    },
  });

  if (!annotation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (annotation.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Block deletion if session is in reviewing or closed state
  const sessionStatus = annotation.group.session.status;
  if (["reviewing", "closed"].includes(sessionStatus)) {
    return NextResponse.json(
      { error: "Cannot delete annotations in reviewing/closed sessions" },
      { status: 400 }
    );
  }

  await prisma.annotation.delete({ where: { id } });

  // Emit real-time event
  const io = getIO();
  if (io) {
    const groupId = annotation.groupId;
    const sessionId = annotation.group.session.id;
    const event = { annotationId: id, groupId, sessionId };
    io.to(`group:${groupId}`).emit("annotation:deleted", event);
    io.to(`session:${sessionId}`).emit("annotation:deleted", event);
  }

  return NextResponse.json({ success: true });
}

// Confirm/unconfirm an annotation (group consensus)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action } = body as { action: "confirm" | "unconfirm" };

  const annotation = await prisma.annotation.findUnique({
    where: { id },
    include: {
      group: {
        include: {
          members: { select: { userId: true } },
          session: { select: { id: true, status: true } },
        },
      },
    },
  });

  if (!annotation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Must be in group phase
  if (annotation.group.session.status !== "group") {
    return NextResponse.json({ error: "Consensus only available in group phase" }, { status: 400 });
  }

  // Must be a group member
  const isMember = annotation.group.members.some((m) => m.userId === session.user.id);
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const currentConfirmed = (annotation.confirmedBy as string[]) || [];
  const memberCount = annotation.group.members.length;
  const threshold = Math.min(2, memberCount); // 2 confirmations or all members if group < 2

  let newConfirmed: string[];
  if (action === "confirm") {
    newConfirmed = currentConfirmed.includes(session.user.id)
      ? currentConfirmed
      : [...currentConfirmed, session.user.id];
  } else {
    newConfirmed = currentConfirmed.filter((uid) => uid !== session.user.id);
  }

  const isGroupAnswer = newConfirmed.length >= threshold;

  const updated = await prisma.annotation.update({
    where: { id },
    data: {
      confirmedBy: newConfirmed,
      isGroupAnswer,
    },
  });

  // Emit real-time event
  const io = getIO();
  if (io) {
    const groupId = annotation.groupId;
    const sessionId = annotation.group.session.id;
    const event = { annotationId: id, groupId, confirmedBy: newConfirmed, isGroupAnswer, sessionId };
    io.to(`group:${groupId}`).emit("annotation:confirmed", event);
    io.to(`session:${sessionId}`).emit("annotation:confirmed", event);
  }

  return NextResponse.json(updated);
}
