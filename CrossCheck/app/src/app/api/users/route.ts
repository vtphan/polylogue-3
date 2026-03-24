import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// List students created by this teacher
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const students = await prisma.user.findMany({
    where: { role: "student", createdBy: session.user.id },
    select: { id: true, username: true, displayName: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(students);
}

// Create a new student account
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { username, displayName } = body;

  if (!username || !displayName) {
    return NextResponse.json(
      { error: "username and displayName required" },
      { status: 400 }
    );
  }

  // Check if username already exists
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 409 }
    );
  }

  const student = await prisma.user.create({
    data: {
      username,
      displayName,
      role: "student",
      createdBy: session.user.id,
    },
    select: { id: true, username: true, displayName: true },
  });

  return NextResponse.json(student, { status: 201 });
}
