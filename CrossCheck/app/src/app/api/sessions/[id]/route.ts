import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIO } from "@/lib/socket-server";
import { VALID_DIFFICULTY_MODES, MODE_KNOB_INFO, SESSION_MODES } from "@/lib/types";
import type { SessionMode } from "@/lib/types";

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

    // During individual phase, students only see their own annotations
    if (classSession.status === "individual") {
      return NextResponse.json({
        ...classSession,
        groups: classSession.groups.map((g) => ({
          ...g,
          annotations: g.annotations.filter((a) => a.userId === session.user.id),
        })),
      });
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
  const { status, notes, action, groupId: targetGroupId, difficultyMode, modeConfig } = body as {
    status?: string;
    notes?: string;
    action?: string;
    groupId?: string;
    difficultyMode?: string;
    modeConfig?: Record<string, string>;
  };

  const classSession = await prisma.session.findUnique({ where: { id } });
  if (!classSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (classSession.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Mid-session practice mode change
  if (action === "change_mode") {
    if (!targetGroupId || !difficultyMode) {
      return NextResponse.json({ error: "groupId and difficultyMode required" }, { status: 400 });
    }
    if (!VALID_DIFFICULTY_MODES.includes(difficultyMode as typeof VALID_DIFFICULTY_MODES[number])) {
      return NextResponse.json({ error: `Invalid mode: ${difficultyMode}` }, { status: 400 });
    }
    if (["setup", "closed"].includes(classSession.status)) {
      return NextResponse.json({ error: "Cannot change mode in setup or closed phase" }, { status: 400 });
    }
    if (modeConfig && SESSION_MODES.includes(difficultyMode as SessionMode)) {
      const knob = MODE_KNOB_INFO[difficultyMode as SessionMode];
      const value = modeConfig[knob.key];
      if (value && !knob.options.some((o) => o.value === value)) {
        return NextResponse.json({ error: `Invalid ${knob.key} value "${value}" for mode "${difficultyMode}"` }, { status: 400 });
      }
    }

    const group = await prisma.group.findFirst({ where: { id: targetGroupId, sessionId: id } });
    if (!group) {
      return NextResponse.json({ error: "Group not found in this session" }, { status: 404 });
    }

    const oldConfig = group.config as { difficulty_mode?: string } | null;
    const oldMode = oldConfig?.difficulty_mode || "classify";

    const updatedGroup = await prisma.group.update({
      where: { id: targetGroupId },
      data: { config: { difficulty_mode: difficultyMode, ...modeConfig } },
    });

    await prisma.sessionEvent.create({
      data: {
        sessionId: id,
        eventType: "mode_changed",
        actorId: session.user.id,
        payload: { groupId: targetGroupId, from: oldMode, to: difficultyMode },
      },
    });

    const io = getIO();
    if (io) {
      io.to(`session:${id}`).emit("session:mode_changed", {
        sessionId: id,
        groupId: targetGroupId,
        newMode: difficultyMode,
      });
    }

    return NextResponse.json(updatedGroup);
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

  // Emit real-time event to all participants in this session
  const io = getIO();
  if (io) {
    io.to(`session:${id}`).emit("session:phase_changed", {
      sessionId: id,
      from: classSession.status,
      to: status,
    });
  }

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

  // Schema has onDelete: Cascade on all child relations,
  // so deleting the session cascades to groups, members, annotations, comments, scaffolds, events.
  await prisma.session.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
