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

  const activity = await prisma.activity.findUnique({
    where: { id },
  });

  if (!activity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Students see content-only transcript (metadata stripped)
  // Teachers and researchers see full transcript
  if (session.user.role === "student") {
    return NextResponse.json({
      id: activity.id,
      scenarioId: activity.scenarioId,
      type: activity.type,
      topic: activity.topic,
      agents: activity.agents,
      transcript: activity.transcriptContent,
    });
  }

  return NextResponse.json({
    id: activity.id,
    scenarioId: activity.scenarioId,
    type: activity.type,
    topic: activity.topic,
    agents: activity.agents,
    transcript: activity.transcript,
    evaluation: activity.evaluation,
    metadata: session.user.role === "researcher" ? activity.metadata : undefined,
  });
}

/**
 * DELETE /api/activities/[id] — Delete an activity (researcher only).
 * Blocks if active sessions exist. Use ?force=true to delete with completed sessions.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "researcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      sessions: {
        select: { id: true, status: true, teacherId: true },
      },
    },
  });

  if (!activity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const activeSessions = activity.sessions.filter((s) => s.status === "active");
  const completedSessions = activity.sessions.filter((s) => s.status === "complete");

  // Block if active sessions exist
  if (activeSessions.length > 0) {
    return NextResponse.json({
      error: `Cannot delete: ${activeSessions.length} active session(s) use this activity`,
      activeSessions: activeSessions.length,
      completedSessions: completedSessions.length,
    }, { status: 409 });
  }

  // If completed sessions exist, require ?force=true
  const force = request.nextUrl.searchParams.get("force") === "true";
  if (completedSessions.length > 0 && !force) {
    return NextResponse.json({
      error: `Activity has ${completedSessions.length} completed session(s). Use ?force=true to delete.`,
      completedSessions: completedSessions.length,
    }, { status: 409 });
  }

  // Cascade delete: sessions → groups → annotations → etc.
  await prisma.activity.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
