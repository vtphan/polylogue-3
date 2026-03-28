import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIO } from "@/lib/socket-server";
import { computeRecognizeHint, computeExplainHint, computeLocateHint, findLocateHintTarget } from "@/lib/hints";
import { isFalsePositive } from "@/lib/false-positives";
import { buildSectionToTurnMap } from "@/lib/transcript";
import type { FlawType, FlawIndexEntry, Transcript } from "@/lib/types";

/**
 * POST /api/hints — Request a hint. Records usage and returns hint content.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId, groupId, turnId, stage, targetSection } = body;

  if (!sessionId || !groupId || !turnId || !stage) {
    return NextResponse.json(
      { error: "sessionId, groupId, turnId, and stage required" },
      { status: 400 }
    );
  }

  if (!["recognize", "explain", "locate"].includes(stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  // Verify membership
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
  }

  // Get session + activity data
  const classSession = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { activity: true },
  });
  if (!classSession || classSession.status !== "active") {
    return NextResponse.json({ error: "Session not active" }, { status: 400 });
  }

  const flawIndex = classSession.activity.flawIndex as unknown as FlawIndexEntry[];
  const transcript = classSession.activity.transcript as unknown as Transcript;

  // Get current hint level for this student + turn
  const existingHints = await prisma.hintUsage.findMany({
    where: {
      studentId: session.user.id,
      sessionId,
      groupId,
      turnId,
      stage,
    },
    orderBy: { createdAt: "desc" },
  });

  const currentLevel = existingHints.length > 0
    ? Math.max(...existingHints.map((h) => h.hintLevel))
    : 0;

  // Find the flaw for this turn (null for non-flawed turns)
  const flaw = flawIndex.find((f) => f.locations.includes(turnId));

  let hintResult: Record<string, unknown> | null = null;

  if (stage === "recognize") {
    // Reconstruct eliminated choices by replaying hint computation
    const eliminated: FlawType[] = [];
    const correctType = flaw ? (flaw.flaw_type as FlawType) : null;
    for (let i = 0; i < currentLevel; i++) {
      const result = computeRecognizeHint(correctType, i, eliminated);
      if (result) eliminated.push(result.eliminatedChoice);
    }

    const result = computeRecognizeHint(correctType, currentLevel, eliminated);
    if (!result) {
      return NextResponse.json({ error: "No more hints available" }, { status: 400 });
    }

    hintResult = {
      hintLevel: result.hintLevel,
      eliminatedChoice: result.eliminatedChoice,
    };
  } else if (stage === "explain") {
    if (!flaw) {
      return NextResponse.json({ error: "No flaw for this turn in explain" }, { status: 400 });
    }

    const result = computeExplainHint(flaw.flaw_type as FlawType, currentLevel);
    if (!result) {
      return NextResponse.json({ error: "No more hints available" }, { status: 400 });
    }

    hintResult = { ...result };
  } else if (stage === "locate") {
    if (!targetSection) {
      return NextResponse.json({ error: "targetSection required for locate hints" }, { status: 400 });
    }

    const sectionMap = buildSectionToTurnMap(transcript);

    // Find the best flaw to hint about for this section
    const unresolvedFlaws = flawIndex.filter((f) => {
      // Check if this flaw has already been found (flagged correctly by the group)
      // For now, use all flaws — the Locate targets will filter this
      return true;
    });

    const hintLevels = new Map<string, number>();
    for (const h of existingHints) {
      if (h.flawId) {
        const current = hintLevels.get(h.flawId) || 0;
        hintLevels.set(h.flawId, Math.max(current, h.hintLevel));
      }
    }

    const targetFlaw = findLocateHintTarget(targetSection, unresolvedFlaws, hintLevels, sectionMap);

    if (!targetFlaw) {
      // No flaw in this section — free denial
      return NextResponse.json({
        hintLevel: 0,
        sectionHasFlaw: false,
        section: targetSection,
        isFreeCheck: true,
      });
    }

    const flawCurrentLevel = hintLevels.get(targetFlaw.flaw_id) || 0;
    const result = computeLocateHint(targetSection, flawCurrentLevel, targetFlaw, sectionMap);

    if (!result) {
      return NextResponse.json({ error: "No more hints available for this flaw" }, { status: 400 });
    }

    if (result.isFreeCheck) {
      // Section denial — don't record
      return NextResponse.json(result);
    }

    hintResult = { ...result };

    // For locate, store the flaw ID
    await prisma.hintUsage.create({
      data: {
        studentId: session.user.id,
        sessionId,
        groupId,
        flawId: targetFlaw.flaw_id,
        turnId,
        hintLevel: result.hintLevel,
        stage,
        targetSection,
      },
    });

    // Emit hint:used event
    const io = getIO();
    if (io) {
      io.to(`group:${groupId}`).emit("hint:used", {
        groupId,
        studentId: session.user.id,
        turnId,
        stage,
        hintLevel: result.hintLevel,
      });
      io.to(`session:${sessionId}`).except(`group:${groupId}`).emit("hint:used", {
        groupId,
        studentId: session.user.id,
        turnId,
        stage,
        hintLevel: result.hintLevel,
      });
    }

    return NextResponse.json(hintResult);
  }

  // Record hint usage (recognize and explain)
  if (hintResult && stage !== "locate") {
    await prisma.hintUsage.create({
      data: {
        studentId: session.user.id,
        sessionId,
        groupId,
        flawId: flaw?.flaw_id || null,
        turnId,
        hintLevel: hintResult.hintLevel as number,
        stage,
      },
    });

    // Emit hint:used event
    const io = getIO();
    if (io) {
      io.to(`group:${groupId}`).emit("hint:used", {
        groupId,
        studentId: session.user.id,
        turnId,
        stage,
        hintLevel: hintResult.hintLevel,
      });
      io.to(`session:${sessionId}`).except(`group:${groupId}`).emit("hint:used", {
        groupId,
        studentId: session.user.id,
        turnId,
        stage,
        hintLevel: hintResult.hintLevel,
      });
    }
  }

  return NextResponse.json(hintResult);
}

/**
 * GET /api/hints — Fetch all hint records for state restoration on page reload.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const groupId = searchParams.get("groupId");

  if (!sessionId || !groupId) {
    return NextResponse.json({ error: "sessionId and groupId required" }, { status: 400 });
  }

  const hints = await prisma.hintUsage.findMany({
    where: {
      studentId: session.user.id,
      sessionId,
      groupId,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(hints);
}
