import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIO } from "@/lib/socket-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: groupId } = await params;
  const body = await request.json();
  const { ready } = body as { ready: boolean };

  // Verify student is a member of this group
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
    include: {
      group: {
        select: {
          id: true,
          phase: true,
          session: { select: { id: true, status: true } },
          _count: { select: { members: true } },
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
  }

  if (membership.group.session.status !== "active") {
    return NextResponse.json({ error: "Session is not active" }, { status: 409 });
  }

  // Can't signal ready in reviewing (terminal phase)
  if (membership.group.phase === "reviewing") {
    return NextResponse.json({ error: "Cannot signal ready in reviewing phase" }, { status: 400 });
  }

  if (ready) {
    await prisma.groupReady.upsert({
      where: { groupId_userId: { groupId, userId: session.user.id } },
      create: { groupId, userId: session.user.id },
      update: {},
    });
  } else {
    await prisma.groupReady.deleteMany({
      where: { groupId, userId: session.user.id },
    });
  }

  // Count current ready signals
  const readyCount = await prisma.groupReady.count({ where: { groupId } });

  // Emit Socket.IO event
  try {
    const io = getIO();
    io?.to(`session:${membership.group.session.id}`).emit("group:ready_changed", {
      groupId,
      userId: session.user.id,
      ready,
      readyCount,
      totalMembers: membership.group._count.members,
    });
  } catch {
    // Socket.IO not available
  }

  return NextResponse.json({ groupId, ready, readyCount, totalMembers: membership.group._count.members });
}
