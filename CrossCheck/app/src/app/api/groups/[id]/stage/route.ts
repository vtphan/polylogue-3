import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIO } from "@/lib/socket-server";
import { STAGE_TRANSITIONS } from "@/lib/types";
import type { SessionStage, FlawIndexEntry } from "@/lib/types";
import { selectExplainTurns, selectCollaborateTurns } from "@/lib/turn-selection";
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
  // Auto-triggered: explain→collaborate (always), collaborate→locate/results (conditional)
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
    // Explain always transitions to Collaborate
    resolvedTarget = "collaborate";
  } else if (currentStage === "collaborate" && !targetStage) {
    // Auto-determine: check if Locate should trigger
    const flawIndex = group.session.activity.flawIndex as unknown as FlawIndexEntry[];

    // Get all Recognize responses for this group
    const recognizeResponses = await prisma.flawResponse.findMany({
      where: { groupId, stage: "recognize" },
      select: { flawId: true, userId: true, typeAnswer: true, typeCorrect: true },
    });

    // Get group's Collaborate type selections
    const collaborateResponses = await prisma.flawResponse.findMany({
      where: { groupId, stage: "collaborate" },
      select: { flawId: true, typeAnswer: true },
    });

    const locateTargets = getLocateTargets(flawIndex, recognizeResponses, collaborateResponses);
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
  const newPhase = resolvedTarget === "recognize" ? "individual"
    : resolvedTarget === "results" ? "reviewing"
    : "group";

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

  // Handle empty-stage skipping: chain transitions server-side
  const flawIndex = group.session.activity.flawIndex as unknown as FlawIndexEntry[];
  const transcript = group.session.activity.transcript as unknown as Transcript;
  const allTurns = extractTurns(transcript);

  const recognizeResponses = await prisma.flawResponse.findMany({
    where: { groupId, stage: "recognize" },
    select: { flawId: true, userId: true, typeAnswer: true, typeCorrect: true },
  });

  // Skip empty Explain: if no unanimously correct turns, chain to Collaborate
  if (resolvedTarget === "explain") {
    const eTurns = selectExplainTurns(allTurns, flawIndex, recognizeResponses);
    if (eTurns.length === 0) {
      resolvedTarget = "collaborate";
      // Re-update the DB with the chained target
      await prisma.$transaction([
        prisma.group.update({
          where: { id: groupId },
          data: { stage: resolvedTarget, phase: "group" },
        }),
        prisma.groupReady.deleteMany({ where: { groupId } }),
      ]);
    }
  }

  // Skip empty Collaborate: if no error turns, chain to Locate check
  if (resolvedTarget === "collaborate") {
    const cTurns = selectCollaborateTurns(allTurns, flawIndex, recognizeResponses);
    if (cTurns.length === 0) {
      // No collaborate turns — check Locate trigger (with empty collaborate selections)
      const locTargets = getLocateTargets(flawIndex, recognizeResponses, []);
      resolvedTarget = locTargets.length > 0 ? "locate" : "results";
      await prisma.$transaction([
        prisma.group.update({
          where: { id: groupId },
          data: {
            stage: resolvedTarget,
            phase: resolvedTarget === "results" ? "reviewing" : "group",
          },
        }),
        prisma.groupReady.deleteMany({ where: { groupId } }),
      ]);
    }
  }

  // Compute response data for the final resolved target
  let explainTurns = undefined;
  let collaborateTurns = undefined;
  let locateTargets = undefined;

  if (resolvedTarget === "explain") {
    explainTurns = selectExplainTurns(allTurns, flawIndex, recognizeResponses);
  }

  if (resolvedTarget === "collaborate") {
    collaborateTurns = selectCollaborateTurns(allTurns, flawIndex, recognizeResponses);
  }

  if (resolvedTarget === "locate") {
    const collaborateResponses = await prisma.flawResponse.findMany({
      where: { groupId, stage: "collaborate" },
      select: { flawId: true, typeAnswer: true },
    });
    locateTargets = getLocateTargets(flawIndex, recognizeResponses, collaborateResponses);
  }

  // Recompute phase for final resolved target
  const finalPhase = resolvedTarget === "recognize" ? "individual"
    : resolvedTarget === "results" ? "reviewing"
    : "group";

  return NextResponse.json({
    groupId,
    fromStage: currentStage,
    toStage: resolvedTarget,
    phase: finalPhase,
    ...(explainTurns ? { explainTurns } : {}),
    ...(collaborateTurns ? { collaborateTurns } : {}),
    ...(locateTargets ? { locateTargets } : {}),
  });
}
