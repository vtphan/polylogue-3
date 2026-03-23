import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ResetPasswordButton } from "@/components/reset-password-button";

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
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {students.map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">{s.displayName}</span>
                  <span className="text-sm text-gray-400 ml-2">{s.username}</span>
                </div>
                <ResetPasswordButton studentId={s.id} studentName={s.displayName} />
              </div>
            ))}
          </div>
        </div>
      )}

      {otherStudents.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Other students</h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {otherStudents.map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">{s.displayName}</span>
                  <span className="text-sm text-gray-400 ml-2">{s.username}</span>
                </div>
                <ResetPasswordButton studentId={s.id} studentName={s.displayName} />
              </div>
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
