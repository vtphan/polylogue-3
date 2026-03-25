import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VALID_DIFFICULTY_MODES } from "@/lib/types";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "teacher") {
    const sessions = await prisma.session.findMany({
      where: { teacherId: session.user.id },
      include: {
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
  const { activityId, groups, config } = body as {
    activityId: string;
    groups: { name: string; studentIds: string[]; difficultyMode?: string }[];
    config?: Record<string, unknown>;
  };

  if (!activityId || !groups || groups.length === 0) {
    return NextResponse.json(
      { error: "activityId and groups required" },
      { status: 400 }
    );
  }

  // Validate difficulty modes
  for (const g of groups) {
    if (g.difficultyMode && !VALID_DIFFICULTY_MODES.includes(g.difficultyMode as typeof VALID_DIFFICULTY_MODES[number])) {
      return NextResponse.json(
        { error: `Invalid difficulty mode: ${g.difficultyMode}` },
        { status: 400 }
      );
    }
  }

  const newSession = await prisma.session.create({
    data: {
      teacherId: session.user.id,
      activityId,
      status: "setup",
      config: config || {},
      groups: {
        create: groups.map((g) => ({
          name: g.name,
          config: { difficulty_mode: g.difficultyMode || (config as Record<string, unknown>)?.difficulty_mode || "classify" },
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
