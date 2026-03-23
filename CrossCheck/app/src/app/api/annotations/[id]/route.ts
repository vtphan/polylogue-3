import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Only allow deleting own annotations
  const annotation = await prisma.annotation.findUnique({
    where: { id },
    include: {
      group: {
        include: { session: { select: { status: true } } },
      },
    },
  });

  if (!annotation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (annotation.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Block deletion if session is in reviewing or closed state
  const sessionStatus = annotation.group.session.status;
  if (["reviewing", "closed"].includes(sessionStatus)) {
    return NextResponse.json(
      { error: "Cannot delete annotations in reviewing/closed sessions" },
      { status: 400 }
    );
  }

  await prisma.annotation.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
