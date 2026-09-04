import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "vt_totp_hint";

/**
 * Best-effort "does this account currently have an authenticator app
 * enrolled" hint — NOT a security signal. StartTotpEnrollment/
 * ConfirmTotpEnrollment/RemoveTotp (lib/api/auth.ts) all still hit the real
 * backend/mock store and enforce their own truth regardless of this value;
 * it exists purely to decide which UI state the settings page's MfaSettings
 * component shows on load, because neither /auth/me nor any other endpoint
 * currently reports TOTP enrollment status — there's nowhere authoritative
 * to read it back from otherwise. Set whenever confirm/remove succeeds
 * (app/customer/settings/actions.ts, app/vendor/settings/actions.ts); worst
 * case on a fresh browser/session it's wrong for one page load until the
 * user acts once, not a security exposure.
 */
export async function setTotpHint(enabled: boolean): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, enabled ? "1" : "0", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
}

export async function getTotpHint(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "1";
}
