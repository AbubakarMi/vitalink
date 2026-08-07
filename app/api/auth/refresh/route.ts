import { NextResponse, type NextRequest } from "next/server";
import { refreshSession } from "@/lib/api/auth";

/**
 * Rotates the session cookies. Route Handlers can call cookies().set() (Server
 * Components can't), which is why lib/auth/dal.ts's requireSession() redirects
 * here instead of refreshing inline — see design doc §2.2.
 */
export async function GET(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get("redirect") ?? "/";
  const target = redirectTo.startsWith("/") ? redirectTo : "/"; // guard against open redirects

  const refreshed = await refreshSession();

  if (!refreshed) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", target);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(target, request.url));
}
