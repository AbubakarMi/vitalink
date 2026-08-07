import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIES, verifyAccessToken } from "@/lib/auth/session";
import { PATH_PREFIX_ACCOUNT_TYPE, dashboardPathForAccountType, matchProtectedPrefix } from "@/lib/auth/route-groups";

/**
 * Fast, optimistic role gate — cookie-only, no network/DB calls (Next's own
 * guidance: Proxy runs on every navigation, including prefetches, so it must stay
 * cheap and must not be the only line of defense). The authoritative check lives in
 * lib/auth/dal.ts, called per-page and per-Server-Action — see design doc §2.2.
 */
export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const prefix = matchProtectedPrefix(pathname);

  if (!prefix) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(SESSION_COOKIES.accessToken)?.value;

  if (!accessToken) {
    // No refresh cookie either -> definitely unauthenticated, redirect now.
    // A refresh cookie present -> let the page-level DAL hand off to the refresh
    // Route Handler (it needs to set cookies, which proxy.ts's response can also
    // do, but doing the refresh itself here would be a network call inside the
    // optimistic fast path -- deferred to the DAL on purpose, design doc §3 step 3).
    if (!request.cookies.has(SESSION_COOKIES.refreshToken)) {
      return redirectToLogin(request);
    }
    return NextResponse.next();
  }

  const claims = await verifyAccessToken(accessToken);

  if (!claims) {
    if (!request.cookies.has(SESSION_COOKIES.refreshToken)) {
      return redirectToLogin(request);
    }
    return NextResponse.next();
  }

  if (claims.accountType !== PATH_PREFIX_ACCOUNT_TYPE[prefix]) {
    return NextResponse.redirect(new URL(dashboardPathForAccountType(claims.accountType), request.url));
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Only run on the protected prefixes (/buyer, /vendor, /admin). Everything else
     * — (marketing), (auth), static assets, image optimization — passes through
     * untouched. See lib/auth/route-groups.ts for the prefix list.
     */
    "/buyer/:path*",
    "/vendor/:path*",
    "/admin/:path*",
  ],
};
