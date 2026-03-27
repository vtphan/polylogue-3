import { redirect } from "next/navigation";

// Session creation now happens within a class context.
// Redirect to the classes page.
export default function NewSessionPage() {
  redirect("/teacher");
}
