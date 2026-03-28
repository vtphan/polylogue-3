import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIO } from "@/lib/socket-server";

/**
 * POST /api/explanations — Submit a collaborative writing explanation.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId, groupId, turnId, text, revisionOf } = body;

  if (!sessionId || !groupId || !turnId || !text) {
    return NextResponse.json(
      { error: "sessionId, groupId, turnId, and text required" },
      { status: 400 }
    );
  }

  // Verify membership
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
  }

  const explanation = await prisma.explanation.create({
    data: {
      turnId,
      authorId: session.user.id,
      groupId,
      sessionId,
      text,
      revisionOf: revisionOf || null,
    },
  });

  // Emit real-time event
  const io = getIO();
  if (io) {
    const event = {
      groupId,
      turnId,
      authorId: session.user.id,
      explanationId: explanation.id,
    };
    io.to(`group:${groupId}`).emit("explanation:submitted", event);
    io.to(`session:${sessionId}`).except(`group:${groupId}`).emit("explanation:submitted", event);
  }

  return NextResponse.json(explanation, { status: 201 });
}

/**
 * GET /api/explanations — Fetch explanations for a group in a session.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const groupId = searchParams.get("groupId");
  const turnId = searchParams.get("turnId");

  if (!sessionId || !groupId) {
    return NextResponse.json({ error: "sessionId and groupId required" }, { status: 400 });
  }

  const where: Record<string, string> = { sessionId, groupId };
  if (turnId) where.turnId = turnId;

  const explanations = await prisma.explanation.findMany({
    where,
    include: {
      author: { select: { id: true, displayName: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(explanations);
}
