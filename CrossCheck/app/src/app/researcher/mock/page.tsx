import { prisma } from "@/lib/db";
import { MockClassForm } from "./mock-class-form";

export default async function MockDataPage() {
  const teachers = await prisma.user.findMany({
    where: { role: "teacher" },
    select: { id: true, displayName: true },
    orderBy: { displayName: "asc" },
  });

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Generate Mock Data</h1>
      <p className="text-sm text-gray-500 mb-6">
        Create a demo class with fake students for a teacher to experiment with.
      </p>

      {teachers.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
          No teachers exist yet. <a href="/researcher/teachers/new" className="text-amber-900 underline">Create a teacher first.</a>
        </div>
      ) : (
        <MockClassForm teachers={teachers} />
      )}
    </div>
  );
}
