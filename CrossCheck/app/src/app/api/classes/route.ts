import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const classes = await prisma.class.findMany({
    where: { teacherId: session.user.id },
    include: {
      _count: { select: { students: true, sessions: true } },
      sessions: {
        where: { status: { not: "closed" } },
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(classes);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, studentIds } = body as { name: string; studentIds?: string[] };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Class name required" }, { status: 400 });
  }

  const newClass = await prisma.class.create({
    data: {
      teacherId: session.user.id,
      name: name.trim(),
      students: studentIds?.length
        ? { create: studentIds.map((id) => ({ userId: id })) }
        : undefined,
    },
    include: { _count: { select: { students: true } } },
  });

  return NextResponse.json(newClass, { status: 201 });
}
