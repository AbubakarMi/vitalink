import "server-only";
import { cookies } from "next/headers";
import setCookieParser from "set-cookie-parser";

/**
 * Relays Set-Cookie headers from a .NET backend response onto this app's own
 * outgoing response, so the __Host-access_token/__Host-refresh_token cookies
 * appear (from the browser's perspective) to have been set by this app's origin —
 * see design doc §3's cookie-topology correction. Only callable from a Server
 * Action or Route Handler (Next.js forbids cookies().set() during Server Component
 * render).
 */
export async function relayCookies(setCookieHeaders: string[]): Promise<void> {
  if (setCookieHeaders.length === 0) {
    return;
  }

  const cookieStore = await cookies();
  const parsed = setCookieParser.parse(setCookieHeaders, { map: false });

  for (const cookie of parsed) {
    cookieStore.set(cookie.name, cookie.value, {
      domain: cookie.domain,
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite as "strict" | "lax" | "none" | undefined,
      maxAge: cookie.maxAge,
      expires: cookie.expires,
    });
  }
}
