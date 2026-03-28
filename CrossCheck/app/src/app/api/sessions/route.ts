import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VALID_DIFFICULTY_MODES, MODE_KNOB_INFO, SESSION_MODES } from "@/lib/types";
import type { SessionMode } from "@/lib/types";

function validateModeConfig(mode: string, modeConfig?: Record<string, string>): string | null {
  if (!modeConfig) return null;
  if (!SESSION_MODES.includes(mode as SessionMode)) return null;
  const knob = MODE_KNOB_INFO[mode as SessionMode];
  const value = modeConfig[knob.key];
  if (value && !knob.options.some((o) => o.value === value)) {
    return `Invalid ${knob.key} value "${value}" for mode "${mode}"`;
  }
  return null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "teacher") {
    const sessions = await prisma.session.findMany({
      where: { teacherId: session.user.id },
      include: {
        class: { select: { id: true, name: true } },
        activity: {
          select: { topic: true, type: true, scenarioId: true, agents: true },
        },
        groups: {
          include: {
            members: { include: { user: { select: { id: true, displayName: true } } } },
            _count: { select: { annotations: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sessions);
  }

  if (session.user.role === "student") {
    // Find sessions where student is a group member (exclude solo sessions)
    const sessions = await prisma.session.findMany({
      where: {
        groups: {
          some: {
            members: { some: { userId: session.user.id } },
            name: { not: { startsWith: "solo_" } },
          },
        },
      },
      include: {
        activity: {
          select: { id: true, topic: true, type: true, agents: true },
        },
        groups: {
          where: { members: { some: { userId: session.user.id } } },
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sessions);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { classId, activityId, groups, config } = body as {
    classId: string;
    activityId: string;
    groups: { name: string; studentIds: string[]; difficultyMode?: string; modeConfig?: Record<string, string> }[];
    config?: Record<string, unknown>;
  };

  if (!classId || !activityId || !groups || groups.length === 0) {
    return NextResponse.json(
      { error: "classId, activityId, and groups required" },
      { status: 400 }
    );
  }

  // Validate class belongs to this teacher
  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: session.user.id },
  });
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  // Validate difficulty modes and knob configs
  for (const g of groups) {
    if (g.difficultyMode && !VALID_DIFFICULTY_MODES.includes(g.difficultyMode as typeof VALID_DIFFICULTY_MODES[number])) {
      return NextResponse.json(
        { error: `Invalid difficulty mode: ${g.difficultyMode}` },
        { status: 400 }
      );
    }
    if (g.difficultyMode && g.modeConfig) {
      const knobError = validateModeConfig(g.difficultyMode, g.modeConfig);
      if (knobError) {
        return NextResponse.json({ error: knobError }, { status: 400 });
      }
    }
  }

  // Determine if this is a new-flow session (no difficultyMode on any group)
  const isNewFlow = groups.every((g) => !g.difficultyMode);

  const newSession = await prisma.session.create({
    data: {
      teacherId: session.user.id,
      classId,
      activityId,
      config: config || {},
      groups: {
        create: groups.map((g) => ({
          name: g.name,
          config: isNewFlow ? {} : { difficulty_mode: g.difficultyMode || (config as Record<string, unknown>)?.difficulty_mode || "classify", ...g.modeConfig },
          // New-flow sessions start at recognize stage (default). Legacy sessions ignore the stage field.
          members: {
            create: g.studentIds.map((sid) => ({ userId: sid })),
          },
        })),
      },
    },
    include: {
      groups: {
        include: {
          members: { include: { user: { select: { id: true, displayName: true } } } },
        },
      },
    },
  });

  return NextResponse.json(newSession, { status: 201 });
}
