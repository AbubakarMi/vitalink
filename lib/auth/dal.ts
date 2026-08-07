import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIES, verifyAccessToken, type SessionClaims } from "./session";
import { PATH_PREFIX_ACCOUNT_TYPE, dashboardPathForAccountType, type ProtectedPathPrefix } from "./route-groups";

/**
 * Authoritative session check, memoized per request with React's `cache()` so
 * multiple pages/leaf components/Server Actions in the same render share one
 * result. This — not proxy.ts, not layout.tsx — is the real security boundary.
 * See design doc §2.2: Next.js layouts don't re-run on every client-side
 * navigation, so a check placed only in layout.tsx can be skipped.
 *
 * Only verifies the access token already present. It does not attempt a refresh —
 * Server Components can't call cookies().set() during render, so refreshing has to
 * happen in a Route Handler (see requireSession() below and app/api/auth/refresh).
 */
export const verifySession = cache(async (): Promise<SessionClaims | null> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SESSION_COOKIES.accessToken)?.value;
  if (!accessToken) {
    return null;
  }
  return verifyAccessToken(accessToken);
});

/**
 * Requires an authenticated session. If the access token is missing/expired but a
 * refresh token cookie exists, hands off to the refresh Route Handler (which can
 * rotate cookies) instead of redirecting straight to login. Otherwise redirects to
 * /login with a return path.
 */
export async function requireSession(currentPath?: string): Promise<SessionClaims> {
  const session = await verifySession();
  if (session) {
    return session;
  }

  const target = currentPath ?? "/";
  const cookieStore = await cookies();

  if (cookieStore.has(SESSION_COOKIES.refreshToken)) {
    redirect(`/api/auth/refresh?redirect=${encodeURIComponent(target)}`);
  }

  redirect(`/login?redirect=${encodeURIComponent(target)}`);
}

/**
 * Requires an authenticated session AND the correct AccountType for the given
 * protected prefix (buyer/vendor/admin). Redirects to that account's own dashboard
 * if the role doesn't match. This is the check every page under /buyer, /vendor,
 * and /admin must call directly (not just rely on their layout) — see design doc §2.2.
 */
export async function requireAccountType(
  prefix: ProtectedPathPrefix,
  currentPath?: string,
): Promise<SessionClaims> {
  const session = await requireSession(currentPath);
  const requiredAccountType = PATH_PREFIX_ACCOUNT_TYPE[prefix];

  if (session.accountType !== requiredAccountType) {
    redirect(dashboardPathForAccountType(session.accountType));
  }

  return session;
}
