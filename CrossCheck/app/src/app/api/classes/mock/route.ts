import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateMockNames } from "@/lib/mock-names";

function toUsername(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
}

/**
 * POST /api/classes/mock — Generate a mock class with fake students for a teacher.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "researcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { teacherId, className, studentCount } = body as {
    teacherId?: string;
    className?: string;
    studentCount?: number;
  };

  if (!teacherId) {
    return NextResponse.json({ error: "teacherId required" }, { status: 400 });
  }

  // Validate teacher exists
  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!teacher || teacher.role !== "teacher") {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const count = Math.min(Math.max(studentCount || 20, 1), 40);
  const baseName = className || "Demo Class";

  // Check for duplicate class name and append number if needed
  let finalName = baseName;
  const existingClasses = await prisma.class.findMany({
    where: { teacherId, name: { startsWith: baseName } },
    select: { name: true },
  });
  if (existingClasses.some((c) => c.name === baseName)) {
    let suffix = 2;
    while (existingClasses.some((c) => c.name === `${baseName} ${suffix}`)) {
      suffix++;
    }
    finalName = `${baseName} ${suffix}`;
  }

  // Get existing display names to avoid collisions
  const existingUsers = await prisma.user.findMany({
    select: { displayName: true },
  });
  const existingNames = new Set(existingUsers.map((u) => u.displayName.toLowerCase()));

  // Generate unique mock names
  const names = generateMockNames(count, existingNames);

  // Create students and class in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create student users
    const students = [];
    for (const name of names) {
      let username = toUsername(name);
      // Handle username collisions
      const existingUsername = await tx.user.findUnique({ where: { username } });
      if (existingUsername) {
        let suffix = 2;
        while (await tx.user.findUnique({ where: { username: `${username}${suffix}` } })) {
          suffix++;
        }
        username = `${username}${suffix}`;
      }

      const student = await tx.user.create({
        data: {
          username,
          displayName: name,
          role: "student",
          createdBy: session.user.id,
        },
        select: { id: true, displayName: true, username: true },
      });
      students.push(student);
    }

    // Create class and enroll students
    const cls = await tx.class.create({
      data: {
        teacherId,
        name: finalName,
        students: {
          create: students.map((s) => ({ userId: s.id })),
        },
      },
      select: { id: true, name: true, teacherId: true },
    });

    return { class: cls, students };
  });

  return NextResponse.json({
    class: result.class,
    students: result.students,
    count: result.students.length,
  }, { status: 201 });
}
