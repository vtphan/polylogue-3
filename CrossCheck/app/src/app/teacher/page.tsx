import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function TeacherHome() {
  const session = await auth();
  if (!session?.user) return null;

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        <Link
          href="/teacher/classes/new"
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          New Class
        </Link>
      </div>

      {classes.length === 0 ? (
        <p className="text-gray-500">No classes yet. Create one to get started.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => {
            const activeSessions = cls.sessions.length;
            return (
              <Link
                key={cls.id}
                href={`/teacher/classes/${cls.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <h2 className="font-semibold text-gray-900 mb-2">{cls.name}</h2>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{cls._count.students} students</span>
                  <span>{cls._count.sessions} sessions</span>
                  {activeSessions > 0 && (
                    <span className="text-green-600 font-medium">
                      {activeSessions} active
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
