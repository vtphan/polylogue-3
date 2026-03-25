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
  const { groupId, flawId, typeAnswer, reasonAnswer } = body as {
    groupId: string;
    flawId: string;
    typeAnswer: string;
    reasonAnswer?: string;
  };

  if (!groupId || !flawId || !typeAnswer) {
    return NextResponse.json({ error: "groupId, flawId, and typeAnswer required" }, { status: 400 });
  }

  // Validate typeAnswer is a valid flaw type
  if (!VALID_FLAW_TYPES.includes(typeAnswer)) {
    return NextResponse.json({ error: `Invalid typeAnswer: ${typeAnswer}` }, { status: 400 });
  }

  // Validate group membership
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
  }

  // Look up the group's session to find the activity evaluation and compute correctness server-side
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { session: { include: { activity: { select: { evaluation: true } } } } },
  });

  let typeCorrect = false;
  let reasonCorrect: boolean | null = null;

  if (group?.session?.activity?.evaluation) {
    const evaluation = group.session.activity.evaluation as {
      flaws?: { flaw_id: string; flaw_type: string; explanation: string }[];
    };
    const referenceFlaw = evaluation.flaws?.find((f) => f.flaw_id === flawId);
    if (referenceFlaw) {
      typeCorrect = referenceFlaw.flaw_type === typeAnswer;
      if (reasonAnswer) {
        // Simple check: reason matches the reference explanation
        reasonCorrect = referenceFlaw.explanation === reasonAnswer;
      }
    }
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
