import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { text, isBonus } = body as { text: string; isBonus?: boolean };

  if (!text?.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  // Verify annotation exists and teacher owns the session
  const annotation = await prisma.annotation.findUnique({
    where: { id },
    include: {
      group: {
        include: { session: { select: { teacherId: true } } },
      },
    },
  });

  if (!annotation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (annotation.group.session.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const comment = await prisma.annotationComment.create({
    data: {
      annotationId: id,
      teacherId: session.user.id,
      text: text.trim(),
      isBonus: isBonus || false,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
