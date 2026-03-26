import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const VALID_FLAW_TYPES = ["reasoning", "epistemic", "completeness", "coherence"];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { groupId, flawId, typeAnswer, correctType, reasonAnswer } = body as {
    groupId: string;
    flawId: string;
    typeAnswer: string;
    correctType?: string; // Only for Learn mode — the known correct answer
    reasonAnswer?: string;
  };

  if (!groupId || !flawId || !typeAnswer) {
    return NextResponse.json({ error: "groupId, flawId, and typeAnswer required" }, { status: 400 });
  }

  // Validate typeAnswer is a valid flaw type
  if (!VALID_FLAW_TYPES.includes(typeAnswer)) {
    return NextResponse.json({ error: `Invalid typeAnswer: ${typeAnswer}` }, { status: 400 });
  }

  // Validate group membership (skip for standalone Learn page where groupId is "standalone")
  if (groupId !== "standalone") {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    }
  }

  let typeCorrect = false;
  let reasonCorrect: boolean | null = null;

  if (flawId.startsWith("learn:")) {
    // Learn mode: correctness is computed from the known correct type sent by the client.
    // This is a vocabulary quiz, not a graded assessment — the static examples are public.
    if (correctType && VALID_FLAW_TYPES.includes(correctType)) {
      typeCorrect = typeAnswer === correctType;
    }
  } else {
    // Recognize mode: compute correctness from the activity evaluation
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { session: { include: { activity: { select: { evaluation: true } } } } },
    });

    if (group?.session?.activity?.evaluation) {
      const evaluation = group.session.activity.evaluation as {
        flaws?: { flaw_id: string; flaw_type: string; explanation: string }[];
      };
      const referenceFlaw = evaluation.flaws?.find((f) => f.flaw_id === flawId);
      if (referenceFlaw) {
        typeCorrect = referenceFlaw.flaw_type === typeAnswer;
        if (reasonAnswer) {
          reasonCorrect = referenceFlaw.explanation === reasonAnswer;
        }
      }
    }
  }

  // For standalone Learn page, store with a synthetic group — skip DB insert since no real group
  if (groupId === "standalone") {
    return NextResponse.json({ id: crypto.randomUUID(), flawId, typeAnswer, typeCorrect }, { status: 201 });
  }

  const response = await prisma.flawResponse.create({
    data: {
      groupId,
      userId: session.user.id,
      flawId,
      typeAnswer,
      typeCorrect,
      reasonAnswer: reasonAnswer ?? null,
      reasonCorrect,
    },
  });

  return NextResponse.json(response, { status: 201 });
}
