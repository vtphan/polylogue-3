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
  const { status } = body as { status: string };

  const validTransitions: Record<string, string[]> = {
    setup: ["individual"],
    individual: ["group"],
    group: ["reviewing"],
    reviewing: ["closed"],
  };

  const classSession = await prisma.session.findUnique({ where: { id } });
  if (!classSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (classSession.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
