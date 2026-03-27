import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: classId } = await params;

  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: session.user.id },
  });
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const body = await request.json();
  const { studentIds } = body as { studentIds: string[] };

  if (!studentIds?.length) {
    return NextResponse.json({ error: "studentIds required" }, { status: 400 });
  }

  // Skip students already in the class
  const existing = await prisma.classStudent.findMany({
    where: { classId, userId: { in: studentIds } },
    select: { userId: true },
  });
  const existingIds = new Set(existing.map((e) => e.userId));
  const newIds = studentIds.filter((id) => !existingIds.has(id));

  if (newIds.length > 0) {
    await prisma.classStudent.createMany({
      data: newIds.map((userId) => ({ classId, userId })),
    });
  }

  return NextResponse.json({ added: newIds.length });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: classId } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: session.user.id },
  });
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  await prisma.classStudent.deleteMany({
    where: { classId, userId },
  });

  return NextResponse.json({ ok: true });
}
