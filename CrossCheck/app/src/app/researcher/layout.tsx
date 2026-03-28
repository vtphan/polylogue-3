import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import Link from "next/link";

export default async function ResearcherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "researcher") {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-6">
              <Link href="/researcher" className="font-bold text-lg">CrossCheck</Link>
              <div className="flex items-center gap-4 text-sm">
                <Link href="/researcher" className="text-gray-600 hover:text-gray-900">Activities</Link>
                <Link href="/researcher/sessions" className="text-gray-600 hover:text-gray-900">Sessions</Link>
                <Link href="/researcher/teachers" className="text-gray-600 hover:text-gray-900">Teachers</Link>
                <Link href="/researcher/mock" className="text-gray-600 hover:text-gray-900">Mock Data</Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                Researcher
              </span>
              <span className="text-sm text-gray-600">
                {session.user.name}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
