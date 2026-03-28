import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { FlawIndexEntry } from "@/lib/types";

/**
 * GET /api/sessions/[id]/analytics — Aggregate hint + performance data across all stages.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const classSession = await prisma.session.findUnique({
    where: { id },
    include: {
      activity: { select: { flawIndex: true } },
      groups: {
        where: { name: { not: { startsWith: "solo_" } } },
        include: {
          members: {
            include: { user: { select: { id: true, displayName: true } } },
          },
          flawResponses: {
            select: {
              userId: true,
              flawId: true,
              typeAnswer: true,
              typeCorrect: true,
              hintLevel: true,
              stage: true,
            },
            orderBy: { createdAt: "asc" },
          },
          hintUsages: {
            select: {
              studentId: true,
              turnId: true,
              hintLevel: true,
              stage: true,
            },
            orderBy: { createdAt: "asc" },
          },
          explanations: {
            select: {
              turnId: true,
              authorId: true,
              text: true,
              revisionOf: true,
            },
            orderBy: { createdAt: "asc" },
          },
          annotations: {
            select: {
              userId: true,
              location: true,
              flawType: true,
              hintLevel: true,
            },
          },
        },
      },
    },
  });

  if (!classSession || classSession.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const flawIndex = classSession.activity.flawIndex as unknown as FlawIndexEntry[];

  const groups = classSession.groups.map((group) => {
    const stage = (group as unknown as { stage: string }).stage;

    // --- Recognize analytics ---
    const recognizeResponses = group.flawResponses.filter((r) => r.stage === "recognize");
    const recognizeHints = group.hintUsages.filter((h) => h.stage === "recognize");

    const recognizeByStudent = new Map<string, {
      turns: { turnId: string; correct: boolean; hintsUsed: number; productiveFailure: boolean }[];
    }>();

    for (const member of group.members) {
      const studentResponses = recognizeResponses.filter((r) => r.userId === member.userId);
      const studentHints = recognizeHints.filter((h) => h.studentId === member.userId);
      const hintsByTurn = new Map<string, number>();
      for (const h of studentHints) {
        hintsByTurn.set(h.turnId, Math.max(hintsByTurn.get(h.turnId) || 0, h.hintLevel));
      }

      recognizeByStudent.set(member.userId, {
        turns: studentResponses.map((r) => ({
          turnId: r.flawId,
          correct: r.typeCorrect,
          hintsUsed: hintsByTurn.get(r.flawId) || r.hintLevel,
          productiveFailure: !r.typeCorrect && r.flawId.startsWith("fp_"),
        })),
      });
    }

    const recognizeStudents = group.members.map((m) => {
      const data = recognizeByStudent.get(m.userId);
      const turns = data?.turns || [];
      const correct = turns.filter((t) => t.correct).length;
      const independent = turns.filter((t) => t.correct && t.hintsUsed === 0).length;
      const withSupport = turns.filter((t) => t.hintsUsed > 0).length;

      return {
        studentId: m.userId,
        displayName: m.user.displayName,
        turns,
        summary: {
          total: turns.length,
          correct,
          independent,
          withSupport,
        },
      };
    });

    // --- Explain analytics ---
    const explainResponses = group.flawResponses.filter((r) => r.stage === "explain");
    const explainHints = group.hintUsages.filter((h) => h.stage === "explain");

    const explainTurnIds = [...new Set(explainResponses.map((r) => r.flawId))];
    const explainTurns = explainTurnIds.map((flawId) => {
      const resp = explainResponses.find((r) => r.flawId === flawId);
      const flaw = flawIndex.find((f) => f.flaw_id === flawId);
      const turnExplanations = group.explanations
        .filter((e) => {
          // Map flawId to turnId through flawIndex locations
          return flaw ? flaw.locations.includes(e.turnId) : false;
        })
        .filter((e) => !e.revisionOf);
      const turnHints = explainHints.filter((h) => flaw?.locations.includes(h.turnId));

      return {
        flawId,
        groupSelection: resp?.typeAnswer || null,
        correct: flaw ? resp?.typeAnswer === flaw.flaw_type : false,
        explanationCount: turnExplanations.length,
        hintsUsed: turnHints.length > 0 ? Math.max(...turnHints.map((h) => h.hintLevel)) : 0,
        hasDisagreement: false, // Would need recognize data to compute
      };
    });

    const writingContributions: Record<string, number> = {};
    for (const e of group.explanations.filter((e) => !e.revisionOf)) {
      writingContributions[e.authorId] = (writingContributions[e.authorId] || 0) + 1;
    }

    // --- Locate analytics ---
    const locateAnnotations = group.annotations.filter((a) => a.hintLevel > 0 || stage === "results");
    const locateHints = group.hintUsages.filter((h) => h.stage === "locate");
    const locateTriggered = stage === "locate" || stage === "results" || locateHints.length > 0;

    // --- Summary ---
    const totalRecognizeCorrect = recognizeStudents.reduce((sum, s) => sum + s.summary.correct, 0);
    const totalRecognizeTurns = recognizeStudents.reduce((sum, s) => sum + s.summary.total, 0);
    const avgRecognizeAccuracy = totalRecognizeTurns > 0 ? totalRecognizeCorrect / totalRecognizeTurns : 0;
    const explainCorrectionRate = explainTurns.length > 0
      ? explainTurns.filter((t) => t.correct).length / explainTurns.length
      : 0;
    const independenceRate = totalRecognizeTurns > 0
      ? recognizeStudents.reduce((sum, s) => sum + s.summary.independent, 0) / totalRecognizeTurns
      : 0;

    return {
      groupId: group.id,
      groupName: group.name,
      currentStage: stage,
      recognize: {
        students: recognizeStudents,
        summary: {
          avgAccuracy: Math.round(avgRecognizeAccuracy * 100),
          totalHints: recognizeHints.length,
          independenceRate: Math.round(independenceRate * 100),
        },
      },
      explain: {
        turns: explainTurns,
        writingContributions,
        summary: {
          turnsDiscussed: explainTurns.length,
          correctionRate: Math.round(explainCorrectionRate * 100),
          totalHints: explainHints.length,
        },
      },
      locate: locateTriggered ? {
        triggered: true,
        totalAnnotations: locateAnnotations.length,
        totalHints: locateHints.length,
      } : { triggered: false },
      summary: {
        recognizeAccuracy: Math.round(avgRecognizeAccuracy * 100),
        explainCorrectionRate: Math.round(explainCorrectionRate * 100),
        independenceRate: Math.round(independenceRate * 100),
        locateTriggered,
        overallFlawCoverage: flawIndex.length > 0
          ? Math.round((flawIndex.filter((f) => {
              const anyCorrect = recognizeResponses.some((r) => r.flawId === f.flaw_id && r.typeCorrect);
              const groupCorrect = explainResponses.some((r) => r.flawId === f.flaw_id && r.typeAnswer === f.flaw_type);
              return anyCorrect || groupCorrect;
            }).length / flawIndex.length) * 100)
          : 0,
      },
    };
  });

  return NextResponse.json({ sessionId: id, groups });
}
