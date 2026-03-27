import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function toUsername(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
}

// Create a new student account
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { displayName, username: explicitUsername } = body;

  if (!displayName) {
    return NextResponse.json({ error: "displayName required" }, { status: 400 });
  }

  const username = explicitUsername || toUsername(displayName);

  // Check for duplicate by display name (case-insensitive) since that's the login key
  const existingByName = await prisma.user.findFirst({
    where: { displayName: { equals: displayName.trim(), mode: "insensitive" } },
  });
  if (existingByName) {
    return NextResponse.json(
      { error: "A student with this name already exists", id: existingByName.id },
      { status: 409 },
    );
  }

  // Also check username uniqueness
  const existingByUsername = await prisma.user.findUnique({ where: { username } });
  if (existingByUsername) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 409 },
    );
  }

  const student = await prisma.user.create({
    data: {
      username,
      displayName: displayName.trim(),
      role: "student",
      createdBy: session.user.id,
    },
    select: { id: true, displayName: true },
  });

  return NextResponse.json(student, { status: 201 });
}
