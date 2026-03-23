import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activityId = request.nextUrl.searchParams.get("activity_id");
  if (!activityId) {
    return NextResponse.json({ error: "activity_id required" }, { status: 400 });
  }

  // Phase 1: no groups — find annotations by user + activity
  const annotations = await prisma.annotation.findMany({
    where: {
      userId: session.user.id,
      group: {
        name: `solo_${session.user.id}`,
        session: { activityId },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(annotations);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { activityId, location, flawType } = body;

  if (!activityId || !location || !flawType) {
    return NextResponse.json(
      { error: "activityId, location, and flawType required" },
      { status: 400 }
    );
  }

  // Phase 1: create a solo "session" and "group" per user per activity if needed
  // This scaffolding gets replaced by real sessions in Phase 2
  const soloGroupName = `solo_${session.user.id}`;

  let group = await prisma.group.findFirst({
    where: {
      name: soloGroupName,
      session: { activityId },
    },
  });

  if (!group) {
    // Create a placeholder session and group
    const soloSession = await prisma.session.create({
      data: {
        teacherId: session.user.id, // placeholder — student acts as own "teacher"
        activityId,
        status: "active",
        config: {},
      },
    });

    group = await prisma.group.create({
      data: {
        sessionId: soloSession.id,
        name: soloGroupName,
        members: {
          create: { userId: session.user.id },
        },
      },
    });
  }

  const annotation = await prisma.annotation.create({
    data: {
      groupId: group.id,
      userId: session.user.id,
      location,
      flawType,
    },
  });

  return NextResponse.json(annotation, { status: 201 });
}
