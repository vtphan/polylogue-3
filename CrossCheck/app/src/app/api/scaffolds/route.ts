import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIO } from "@/lib/socket-server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = request.nextUrl.searchParams.get("session_id");
  const groupId = request.nextUrl.searchParams.get("group_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  // Authorization: teacher must own session, student must be a group member
  const classSession = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      groups: {
        include: { members: { select: { userId: true } } },
      },
    },
  });

  if (!classSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.user.role === "teacher" && classSession.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.user.role === "student") {
    const isMember = classSession.groups.some((g) =>
      g.members.some((m) => m.userId === session.user.id)
    );
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const where: Record<string, unknown> = { sessionId };
  if (groupId) where.groupId = groupId;

  const scaffolds = await prisma.scaffold.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(scaffolds);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { sessionId, groupId, level, type, text, targetLocation } = body;

  if (!sessionId || !groupId || !text) {
    return NextResponse.json(
      { error: "sessionId, groupId, and text required" },
      { status: 400 }
    );
  }

  // Verify teacher owns this session
  const ownedSession = await prisma.session.findUnique({
    where: { id: sessionId },
  });
  if (!ownedSession || ownedSession.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get current group annotation state for context_at_send
  const annotationCount = await prisma.annotation.count({
    where: { groupId },
  });

  const annotations = await prisma.annotation.findMany({
    where: { groupId },
    select: { location: true },
  });

  const sectionsTouched = [
    ...new Set(
      annotations.map((a) => (a.location as { item_id: string }).item_id)
    ),
  ];

  const classSession = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  const timeInSession = classSession
    ? Math.round((Date.now() - classSession.createdAt.getTime()) / 60000)
    : 0;

  const scaffold = await prisma.scaffold.create({
    data: {
      sessionId,
      groupId,
      teacherId: session.user.id,
      level: level || 1,
      type: type || "general",
      text,
      targetLocation: targetLocation || null,
      contextAtSend: {
        annotations_count: annotationCount,
        sections_touched: sectionsTouched,
        time_in_session_minutes: timeInSession,
      },
    },
  });

  // Log the scaffold event
  await prisma.sessionEvent.create({
    data: {
      sessionId,
      eventType: "scaffold_sent",
      actorId: session.user.id,
      payload: {
        scaffoldId: scaffold.id,
        groupId,
        level: scaffold.level,
        type: scaffold.type,
      },
    },
  });

  // Emit real-time event
  const io = getIO();
  if (io) {
    const event = {
      scaffold: {
        id: scaffold.id,
        groupId: scaffold.groupId,
        text: scaffold.text,
        level: scaffold.level,
        type: scaffold.type,
        createdAt: scaffold.createdAt,
        acknowledgedAt: scaffold.acknowledgedAt,
      },
      sessionId,
    };
    io.to(`group:${groupId}`).emit("scaffold:sent", event);
    io.to(`session:${sessionId}`).except(`group:${groupId}`).emit("scaffold:sent", event);
  }

  return NextResponse.json(scaffold, { status: 201 });
}
