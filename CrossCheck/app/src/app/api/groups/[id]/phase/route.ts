import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIO } from "@/lib/socket-server";

const PHASE_ORDER = ["individual", "group", "reviewing"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: groupId } = await params;
  const body = await request.json();
  const { phase } = body as { phase: string };

  if (!phase || !PHASE_ORDER.includes(phase as typeof PHASE_ORDER[number])) {
    return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
  }

  // Fetch group with session to verify ownership
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { session: { select: { id: true, teacherId: true, status: true } } },
  });

  if (!group || group.session.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (group.session.status !== "active") {
    return NextResponse.json({ error: "Session is not active" }, { status: 409 });
  }

  const currentIndex = PHASE_ORDER.indexOf(group.phase);
  const targetIndex = PHASE_ORDER.indexOf(phase as typeof PHASE_ORDER[number]);

  // Allow forward advancement and reviewing → group (reopen)
  if (targetIndex <= currentIndex && !(group.phase === "reviewing" && phase === "group")) {
    return NextResponse.json(
      { error: `Cannot move from ${group.phase} to ${phase}` },
      { status: 400 },
    );
  }

  // Update phase and clear readiness signals
  await prisma.$transaction([
    prisma.group.update({
      where: { id: groupId },
      data: { phase: phase as typeof PHASE_ORDER[number] },
    }),
    prisma.groupReady.deleteMany({ where: { groupId } }),
  ]);

  // Emit Socket.IO event
  try {
    const io = getIO();
    io?.to(`group:${groupId}`).to(`session:${group.session.id}`).emit("group:phase_changed", {
      groupId,
      phase,
    });
  } catch {
    // Socket.IO not available (e.g., plain Next.js dev mode)
  }

  return NextResponse.json({ groupId, phase });
}
