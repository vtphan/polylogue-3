import { prisma } from "@/lib/db";
import Link from "next/link";
import ResetPasswordButton from "./reset-password-button";

export default async function TeachersPage() {
  const teachers = await prisma.user.findMany({
    where: { role: "teacher" },
    select: {
      id: true,
      displayName: true,
      username: true,
      createdAt: true,
      teacherClasses: {
        select: { id: true },
      },
      sessions: {
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Teachers</h1>
        <Link
          href="/researcher/teachers/new"
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Teacher
        </Link>
      </div>

      {teachers.length === 0 ? (
        <p className="text-sm text-gray-400">No teachers yet.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Classes</th>
                <th className="px-4 py-3 font-medium">Sessions</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teachers.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.displayName}</td>
                  <td className="px-4 py-3 text-gray-500">{t.username}</td>
                  <td className="px-4 py-3 text-gray-600">{t.teacherClasses.length}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {t.sessions.length}
                    {t.sessions.some((s) => s.status === "active") && (
                      <span className="ml-1 text-xs text-green-600">
                        ({t.sessions.filter((s) => s.status === "active").length} active)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {t.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <ResetPasswordButton teacherId={t.id} teacherName={t.displayName} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
