import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Create annotation within a real session (Phase 2)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId, groupId, location, flawType } = body;

  if (!sessionId || !groupId || !location || !flawType) {
    return NextResponse.json(
      { error: "sessionId, groupId, location, and flawType required" },
      { status: 400 }
    );
  }

  // Verify student is a member of this group
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: session.user.id },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
  }

  // Verify session is in an annotatable state
  const classSession = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!classSession || ["reviewing", "closed", "setup"].includes(classSession.status)) {
    return NextResponse.json({ error: "Session not accepting annotations" }, { status: 400 });
  }

  const annotation = await prisma.annotation.create({
    data: {
      groupId,
      userId: session.user.id,
      location,
      flawType,
    },
  });

  return NextResponse.json(annotation, { status: 201 });
}
