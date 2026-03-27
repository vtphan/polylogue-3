import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const cls = await prisma.class.findFirst({
    where: { id, teacherId: session.user.id },
    include: {
      students: {
        include: { user: { select: { id: true, username: true, displayName: true } } },
        orderBy: { user: { displayName: "asc" } },
      },
      sessions: {
        include: {
          activity: { select: { topic: true, type: true } },
          groups: { include: { _count: { select: { members: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cls) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(cls);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name } = body as { name?: string };

  const cls = await prisma.class.findFirst({
    where: { id, teacherId: session.user.id },
  });
  if (!cls) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.class.update({
    where: { id },
    data: { ...(name?.trim() ? { name: name.trim() } : {}) },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const cls = await prisma.class.findFirst({
    where: { id, teacherId: session.user.id },
    include: { _count: { select: { sessions: true } } },
  });
  if (!cls) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (cls._count.sessions > 0) {
    return NextResponse.json(
      { error: "Cannot delete a class with existing sessions" },
      { status: 409 },
    );
  }

  await prisma.class.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
