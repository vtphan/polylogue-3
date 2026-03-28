import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

/**
 * PATCH /api/users/[id] — Reset a teacher's password (researcher only).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "researcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const body = await request.json();
  const { password } = body as { password?: string };

  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "Password required (minimum 6 characters)" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, displayName: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.role !== "teacher") {
    return NextResponse.json(
      { error: "Password reset is only available for teacher accounts" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });

  await logAudit({
    actorId: session.user.id,
    action: "password_reset",
    targetId: id,
    targetType: "user",
    payload: { targetDisplayName: user.displayName },
  });

  return NextResponse.json({ ok: true, displayName: user.displayName });
}
