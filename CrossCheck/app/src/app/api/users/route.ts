import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

function toUsername(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
}

// Create a new user account
// - Teachers can create students
// - Researchers can create students or teachers (teacher requires password)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const callerRole = session.user.role;
  if (callerRole !== "teacher" && callerRole !== "researcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { displayName, username: explicitUsername, role: requestedRole, password } = body as {
    displayName?: string;
    username?: string;
    role?: string;
    password?: string;
  };

  if (!displayName) {
    return NextResponse.json({ error: "displayName required" }, { status: 400 });
  }

  // Determine the role to create
  const targetRole = requestedRole || "student";
  if (targetRole !== "student" && targetRole !== "teacher") {
    return NextResponse.json({ error: "role must be 'student' or 'teacher'" }, { status: 400 });
  }

  // Only researchers can create teacher accounts
  if (targetRole === "teacher" && callerRole !== "researcher") {
    return NextResponse.json({ error: "Only researchers can create teacher accounts" }, { status: 403 });
  }

  // Teacher accounts require a password
  if (targetRole === "teacher") {
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password required (minimum 6 characters)" }, { status: 400 });
    }
  }

  const username = explicitUsername || toUsername(displayName);

  // Check for duplicate by display name (case-insensitive)
  const existingByName = await prisma.user.findFirst({
    where: { displayName: { equals: displayName.trim(), mode: "insensitive" } },
  });
  if (existingByName) {
    return NextResponse.json(
      { error: "A user with this name already exists", id: existingByName.id },
      { status: 409 },
    );
  }

  // Check username uniqueness
  const existingByUsername = await prisma.user.findUnique({ where: { username } });
  if (existingByUsername) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  // Hash password for teacher accounts
  const passwordHash = targetRole === "teacher" && password
    ? await bcrypt.hash(password, 10)
    : null;

  const user = await prisma.user.create({
    data: {
      username,
      displayName: displayName.trim(),
      role: targetRole as "student" | "teacher",
      passwordHash,
      createdBy: session.user.id,
    },
    select: { id: true, displayName: true, username: true, role: true },
  });

  await logAudit({
    actorId: session.user.id,
    action: "user_created",
    targetId: user.id,
    targetType: "user",
    payload: { role: targetRole, displayName: user.displayName },
  });

  return NextResponse.json(user, { status: 201 });
}
