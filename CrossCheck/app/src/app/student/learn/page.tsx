import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LearnMode } from "@/components/modes/learn-mode";

export default async function StandaloneLearnPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "student") {
    redirect("/auth/login");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Learn Flaw Types</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review the four flaw types and test your knowledge. You can revisit this page anytime.
        </p>
      </div>
      <LearnMode groupId="standalone" sessionId="standalone" />
    </div>
  );
}
