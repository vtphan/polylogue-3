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
