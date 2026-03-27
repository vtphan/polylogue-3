import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function StudentsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const students = await prisma.user.findMany({
    where: { role: "student", createdBy: session.user.id },
    select: { id: true, username: true, displayName: true, createdAt: true },
    orderBy: { displayName: "asc" },
  });

  // Also show students not created by this teacher (from seed data)
  const otherStudents = await prisma.user.findMany({
    where: {
      role: "student",
      OR: [{ createdBy: null }, { createdBy: { not: session.user.id } }],
    },
    select: { id: true, username: true, displayName: true },
    orderBy: { displayName: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <Link
          href="/teacher/students/new"
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Students
        </Link>
      </div>

      {students.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Your students</h2>
          <div className="flex flex-wrap gap-2">
            {students.map((s) => (
              <span key={s.id} className="text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-full px-3 py-1">
                {s.displayName}
              </span>
            ))}
          </div>
        </div>
      )}

      {otherStudents.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Other students</h2>
          <div className="flex flex-wrap gap-2">
            {otherStudents.map((s) => (
              <span key={s.id} className="text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-full px-3 py-1">
                {s.displayName}
              </span>
            ))}
          </div>
        </div>
      )}

      {students.length === 0 && otherStudents.length === 0 && (
        <p className="text-gray-500">No students yet. Add some to get started.</p>
      )}
    </div>
  );
}
