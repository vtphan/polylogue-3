import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIO } from "@/lib/socket-server";
import { STAGE_TRANSITIONS } from "@/lib/types";
import type { SessionStage, FlawIndexEntry } from "@/lib/types";
import { selectExplainTurns } from "@/lib/turn-selection";
import { getLocateTargets } from "@/lib/locate-trigger";
import { extractTurns } from "@/lib/transcript";
import type { Transcript } from "@/lib/types";

/**
 * PATCH /api/groups/[id]/stage — Advance a group's session stage.
 *
 * Recognize → Explain: Teacher-triggered. Also sets phase to "group".
 * Explain → Locate/Results: Automatic (called by client after last Explain turn).
 * Locate → Results: Teacher-triggered or automatic when all flaws found.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId } = await params;
  const body = await request.json();
  const { targetStage } = body as { targetStage: string };

  // Fetch group with session + activity
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      session: {
        select: {
          id: true,
          teacherId: true,
          status: true,
          activityId: true,
          activity: true,
        },
      },
      members: { select: { userId: true } },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.session.status !== "active") {
    return NextResponse.json({ error: "Session is not active" }, { status: 409 });
  }

  const currentStage = group.stage as SessionStage;

  // Teacher-triggered transitions: recognize→explain, locate→results
  // Student/system-triggered: explain→locate/results
  if (currentStage === "recognize" && session.user.role !== "teacher") {
    return NextResponse.json(
      { error: "Only teacher can transition from recognize to explain" },
      { status: 403 },
    );
  }

  if (currentStage === "recognize" && group.session.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Not the session teacher" }, { status: 403 });
  }

  // Determine the target stage
  let resolvedTarget: SessionStage;

  if (currentStage === "explain" && !targetStage) {
    // Auto-determine: check if Locate should trigger
    const flawIndex = group.session.activity.flawIndex as unknown as FlawIndexEntry[];
    const transcript = group.session.activity.transcript as unknown as Transcript;
    const allTurns = extractTurns(transcript);

    // Get all Recognize responses for this group
    const recognizeResponses = await prisma.flawResponse.findMany({
      where: { groupId, stage: "recognize" },
      select: { flawId: true, userId: true, typeAnswer: true, typeCorrect: true },
    });

    // Get group's Explain selections (Step 1)
    const explainResponses = await prisma.flawResponse.findMany({
      where: { groupId, stage: "explain" },
      select: { flawId: true, typeAnswer: true },
    });

    const locateTargets = getLocateTargets(flawIndex, recognizeResponses, explainResponses);
    resolvedTarget = locateTargets.length > 0 ? "locate" : "results";
  } else if (targetStage) {
    resolvedTarget = targetStage as SessionStage;
  } else {
    // Default: advance to next valid stage
    const validTargets = STAGE_TRANSITIONS[currentStage];
    if (validTargets.length === 0) {
      return NextResponse.json({ error: "No valid transitions from current stage" }, { status: 400 });
    }
    resolvedTarget = validTargets[0];
  }

  // Validate transition
  const validTargets = STAGE_TRANSITIONS[currentStage];
  if (!validTargets.includes(resolvedTarget)) {
    return NextResponse.json(
      { error: `Cannot transition from ${currentStage} to ${resolvedTarget}` },
      { status: 400 },
    );
  }

  // Determine the phase for the new stage
  const newPhase = resolvedTarget === "recognize" ? "individual" : "group";

  // Update stage and phase
  await prisma.$transaction([
    prisma.group.update({
      where: { id: groupId },
      data: {
        stage: resolvedTarget,
        phase: newPhase,
      },
    }),
    prisma.groupReady.deleteMany({ where: { groupId } }),
  ]);

  // Emit stage:transition event
  try {
    const io = getIO();
    if (io) {
      io.to(`group:${groupId}`).to(`session:${group.session.id}`).emit("stage:transition", {
        groupId,
        fromStage: currentStage,
        toStage: resolvedTarget,
      });
    }
  } catch {
    // Socket.IO not available
  }

  // If transitioning to explain, compute and return the explain turns
  let explainTurns = undefined;
  if (resolvedTarget === "explain") {
    const flawIndex = group.session.activity.flawIndex as unknown as FlawIndexEntry[];
    const transcript = group.session.activity.transcript as unknown as Transcript;
    const allTurns = extractTurns(transcript);

    const recognizeResponses = await prisma.flawResponse.findMany({
      where: { groupId, stage: "recognize" },
      select: { flawId: true, userId: true, typeAnswer: true, typeCorrect: true },
    });

    explainTurns = selectExplainTurns(allTurns, flawIndex, recognizeResponses);
  }

  // If transitioning to locate, compute and return locate targets
  let locateTargets = undefined;
  if (resolvedTarget === "locate") {
    const flawIndex = group.session.activity.flawIndex as unknown as FlawIndexEntry[];

    const recognizeResponses = await prisma.flawResponse.findMany({
      where: { groupId, stage: "recognize" },
      select: { flawId: true, userId: true, typeAnswer: true, typeCorrect: true },
    });

    const explainResponses = await prisma.flawResponse.findMany({
      where: { groupId, stage: "explain" },
      select: { flawId: true, typeAnswer: true },
    });

    locateTargets = getLocateTargets(flawIndex, recognizeResponses, explainResponses);
  }

  return NextResponse.json({
    groupId,
    fromStage: currentStage,
    toStage: resolvedTarget,
    phase: newPhase,
    ...(explainTurns ? { explainTurns } : {}),
    ...(locateTargets ? { locateTargets } : {}),
  });
}
