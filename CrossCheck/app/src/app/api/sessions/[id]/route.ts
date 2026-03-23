import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const classSession = await prisma.session.findUnique({
    where: { id },
    include: {
      activity: true,
      groups: {
        where: { name: { not: { startsWith: "solo_" } } },
        include: {
          members: {
            include: { user: { select: { id: true, displayName: true, username: true } } },
          },
          annotations: {
            select: { id: true, flawType: true, location: true, userId: true, createdAt: true },
          },
          scaffolds: {
            select: { id: true, level: true, type: true, text: true, createdAt: true, acknowledgedAt: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!classSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Authorization: teacher must own session, student must be a group member
  if (session.user.role === "teacher" && classSession.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.user.role === "student") {
    const isMember = classSession.groups.some((g) =>
      g.members.some((m) => m.user.id === session.user.id)
    );
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(classSession);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, notes } = body as { status?: string; notes?: string };

  const classSession = await prisma.session.findUnique({ where: { id } });
  if (!classSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (classSession.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Notes-only update (no phase transition)
  if (notes !== undefined && !status) {
    const updated = await prisma.session.update({
      where: { id },
      data: { notes },
    });
    return NextResponse.json(updated);
  }

  if (!status) {
    return NextResponse.json({ error: "status or notes required" }, { status: 400 });
  }

  const validTransitions: Record<string, string[]> = {
    setup: ["individual"],
    individual: ["group"],
    group: ["reviewing"],
    reviewing: ["group", "closed"], // allow reopening to group phase
  };

  const allowed = validTransitions[classSession.status] || [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${classSession.status} to ${status}` },
      { status: 400 }
    );
  }

  const updated = await prisma.session.update({
    where: { id },
    data: {
      status: status as never,
      ...(status === "closed" ? { closedAt: new Date() } : {}),
    },
  });

  // Log the phase change event
  await prisma.sessionEvent.create({
    data: {
      sessionId: id,
      eventType: "phase_changed",
      actorId: session.user.id,
      payload: { from: classSession.status, to: status },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const classSession = await prisma.session.findUnique({ where: { id } });
  if (!classSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (classSession.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!["setup", "closed"].includes(classSession.status)) {
    return NextResponse.json(
      { error: "Can only delete sessions in setup or closed status" },
      { status: 400 }
    );
  }

  // Cascading delete: events, scaffolds, annotations, group members, groups, then session
  await prisma.sessionEvent.deleteMany({ where: { sessionId: id } });
  await prisma.scaffold.deleteMany({ where: { sessionId: id } });

  const groupIds = (await prisma.group.findMany({
    where: { sessionId: id },
    select: { id: true },
  })).map((g) => g.id);

  if (groupIds.length > 0) {
    await prisma.annotation.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.groupMember.deleteMany({ where: { groupId: { in: groupIds } } });
  }
  await prisma.group.deleteMany({ where: { sessionId: id } });
  await prisma.session.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
