import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeMatches } from "@/lib/matching";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const classSession = await prisma.session.findUnique({
    where: { id },
    include: {
      activity: {
        select: { flawIndex: true, evaluation: true },
      },
      groups: {
        where: { name: { not: { startsWith: "solo_" } } },
        include: {
          members: { select: { userId: true } },
          annotations: {
            select: { id: true, flawType: true, location: true, userId: true },
          },
        },
      },
    },
  });

  if (!classSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only available in reviewing or closed sessions
  if (!["reviewing", "closed"].includes(classSession.status)) {
    return NextResponse.json(
      { error: "Feedback not available until evaluation is released" },
      { status: 400 }
    );
  }

  // Authorization: teacher must own session, student must be group member, researcher gets full access
  if (session.user.role === "teacher" && classSession.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.user.role === "student") {
    const isMember = classSession.groups.some((g) =>
      g.members.some((m) => m.userId === session.user.id)
    );
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  // Researchers see all groups' feedback (same as teacher view) — intentional for research data access

  const flawIndex = (classSession.activity.flawIndex || []) as {
    flaw_id: string;
    locations: string[];
    flaw_type: string;
    severity: string;
  }[];

  // Compute matches per group
  const groupFeedback = classSession.groups.map((group) => {
    const annotations = group.annotations.map((a) => ({
      id: a.id,
      location: a.location as { item_id: string },
      flawType: a.flawType,
    }));

    const matches = computeMatches(annotations, flawIndex);

    return {
      groupId: group.id,
      ...matches,
    };
  });

  // For students, only return their group's feedback
  if (session.user.role === "student") {
    const myGroup = classSession.groups.find((g) =>
      g.members.some((m) => m.userId === session.user.id)
    );
    const myFeedback = groupFeedback.find((f) => f.groupId === myGroup?.id);
    return NextResponse.json({
      feedback: myFeedback || null,
      evaluation: classSession.activity.evaluation,
    });
  }

  // Teachers see all groups
  return NextResponse.json({
    feedback: groupFeedback,
    evaluation: classSession.activity.evaluation,
  });
}
