import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const roleRoutes: Record<string, string> = {
  "/student": "student",
  "/teacher": "teacher",
  "/researcher": "researcher",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route requires a specific role
  for (const [prefix, requiredRole] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(prefix)) {
      const session = await auth();

      if (!session?.user) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (session.user.role !== requiredRole) {
        // Redirect to user's own dashboard
        const home = `/${session.user.role}`;
        return NextResponse.redirect(new URL(home, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*", "/researcher/:path*"],
};
