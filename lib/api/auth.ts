import "server-only";
import { z } from "zod";
import { apiClient, ApiError } from "./client";
import { relayCookies } from "./cookie-relay";
import {
  authenticateMockUser,
  clearMockSessionCookies,
  createMockUser,
  findMockUserById,
  findMockUserByEmail,
  rotateMockSession,
  setMockSessionCookies,
} from "./mocks/auth-store";
import {
  isMockTotpEnabled,
  startMockTotpEnrollment,
  confirmMockTotpEnrollment,
  removeMockTotp,
  validateMockTotpCode,
} from "./mocks/security-store";
import { verifySession } from "@/lib/auth/dal";
import { normalizeAccountType } from "@/lib/auth/session";
import { getTotpHint } from "@/lib/auth/totp-hint";

/**
 * Adapter over the real, already-shipped Zitadel-backed auth endpoints (see
 * vitalink-backend Web.Api/Endpoints/Authentication/AuthenticationEndpoints.cs).
 * Plain server-only functions, not "use server" Server Actions — thin Server
 * Action wrappers get colocated with the actual login/register forms when that UI
 * is built; this file is the typed, validated boundary they'll call into.
 *
 * AUTH_DATA_SOURCE flips every function below between that live backend and an
 * in-memory mock (lib/api/mocks/auth-store.ts) — same seam as
 * PRODUCTS_DATA_SOURCE in lib/api/products.ts. Every caller gets the same
 * Zod-validated response shape regardless of source, and mock sessions use
 * real signed JWTs so lib/auth/session.ts and proxy.ts need no changes. See
 * docs/MOCK_AUTH.md.
 */

const SOURCE = process.env.AUTH_DATA_SOURCE ?? "mock";

// ALLOW_MOCK_IN_PRODUCTION is a narrow, explicit escape hatch for demo/preview
// deploys with no live backend yet (e.g. a Netlify preview) — it must be set
// deliberately per-deployment, never left on for a real production release.
// See docs/MOCK_AUTH.md.
const ALLOW_MOCK_IN_PRODUCTION = process.env.ALLOW_MOCK_IN_PRODUCTION === "true";

if (SOURCE === "mock" && process.env.NODE_ENV === "production" && !ALLOW_MOCK_IN_PRODUCTION) {
  // Mirrors lib/auth/permissions.ts's PERMISSIONS_SOURCE guard: a mock, in-memory
  // user store with plaintext-compared passwords must never back a production
  // deployment. Set AUTH_DATA_SOURCE=live once BACKEND_ORIGIN points at a real
  // Zitadel-backed backend.
  throw new Error(
    "AUTH_DATA_SOURCE is still 'mock' in a production build. This fails the build on " +
      "purpose: the mock auth store keeps users in memory with plaintext password " +
      "comparisons and must never ship. Set AUTH_DATA_SOURCE=live once the real backend " +
      "is reachable at BACKEND_ORIGIN, or set ALLOW_MOCK_IN_PRODUCTION=true for a " +
      "throwaway demo deploy with no real user data. See docs/MOCK_AUTH.md.",
  );
}

const BASE = "/auth";

export const AccountTypeSchema = z.enum(["Customer", "Vendor", "Staff"]);
export type AccountType = z.infer<typeof AccountTypeSchema>;

/**
 * Confirmed against a live response (not an assumption anymore): the
 * backend has no global JsonStringEnumConverter registered (only one enum
 * in the whole codebase opts into one individually — see
 * docs/BACKEND_INTEGRATION_GUIDE.md §2.2), so a plain C# enum property both
 * serializes AND deserializes as its integer ordinal. Sending
 * `accountType: "Customer"` (a string) in a POST /auth/register body fails
 * outright — ASP.NET can't bind a JSON string onto an enum-typed property —
 * with a 400 "Failed to read parameter... as JSON", not a validation error.
 * Ordinal order confirmed from Application/Abstractions/Authentication/
 * AuthDto.cs's `enum AccountType { Customer, Vendor, Staff }`.
 */
const ACCOUNT_TYPE_ORDINAL: Record<AccountType, number> = {
  Customer: 0,
  Vendor: 1,
  Staff: 2,
};

// C# enums here are assumed to serialize as strings the same way — not
// confirmed against a live response yet. Flag and fix (see
// ACCOUNT_TYPE_ORDINAL above for the pattern) if these turn out to need the
// same integer-ordinal treatment once MFA is actually exercised live.
const MfaMethodSchema = z.enum(["Totp", "OtpEmail"]);

const LoginResponseSchema = z.object({
  mfaRequired: z.boolean(),
  completed: z.boolean(),
  flowId: z.string().nullable().optional(),
  availableMethods: z.array(MfaMethodSchema).default([]),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

const RegisterResponseSchema = z.object({
  userId: z.string(),
  verificationEmailSent: z.boolean(),
});
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

const LoginOtpEmailStartResponseSchema = z.object({
  maskedEmail: z.string(),
});

const CurrentUserResponseSchema = z.object({
  userId: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  displayName: z.string(),
  // Same raw value as the JWT's account_type claim (both come from the
  // backend's GetAccountTypeAsync()) — needs the same normalization
  // (lowercase, "admin" fallback) or a real account fails this outright.
  // See lib/auth/session.ts's normalizeAccountType comment.
  accountType: z.preprocess((value) => normalizeAccountType(value) ?? value, AccountTypeSchema),
});
export type CurrentUser = z.infer<typeof CurrentUserResponseSchema>;

/**
 * Live-as-you-type email check on the register form (register-form.tsx) —
 * `null` means "can't tell" rather than a false green tick/red mark: no
 * backend endpoint exists to check this without actually registering (see
 * docs/BACKEND_TODO.md), so live mode always returns null. Mock mode is a
 * real check against the same store register() itself reads/writes.
 */
export async function checkEmailAvailability(email: string): Promise<boolean | null> {
  if (SOURCE === "mock") {
    return !findMockUserByEmail(email);
  }
  return null;
}

export interface RegisterInput {
  email: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  accountType: AccountType;
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  if (SOURCE === "mock") {
    // Auto-verified in mock mode only — live mode's verificationEmailSent
    // reflects the backend's real answer; app/(auth)/verify-email is the
    // real page that link/code lands on now.
    const user = createMockUser(input);
    return { userId: user.userId, verificationEmailSent: true };
  }
  const { data } = await apiClient.post<unknown>(`${BASE}/register`, {
    body: { ...input, accountType: ACCOUNT_TYPE_ORDINAL[input.accountType] },
    withCredentials: false,
  });
  return RegisterResponseSchema.parse(data);
}

/**
 * Real registration (`POST auth/register`) only provisions the Zitadel
 * identity — it does NOT create the backend's own `CustomerProfile` row
 * (`Application/Features/Customer/Commands/CreateCustomerProfile`, a
 * separate endpoint, `RequirePermission`-gated so it can only be called
 * with a real session, i.e. after login, not at registration time).
 * Confirmed live: every customer-scoped call (the address book, and
 * likely order placement later) 404s with "CustomerProfile.NotFound"
 * until this runs. Called from login's redirectToDashboard() for every
 * live Customer session, not just once at signup, since there was no
 * other reliable hook — idempotent by design (see the 409 swallow below),
 * so calling it on every login is harmless once a profile already exists.
 * No UI anywhere collects "Individual vs Institutional" (this app only
 * has one buyer registration form), so this always creates an Individual
 * profile — Institutional customers aren't reachable through this app yet.
 */
export async function ensureCustomerProfile(): Promise<void> {
  if (SOURCE === "mock") {
    return; // Mock mode has no matching concept — nothing to provision.
  }
  try {
    await apiClient.post("/users/customers/profile", { body: { customerType: "Individual" } });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return; // CustomerProfile.CustomerProfileAlreadyExists — already provisioned, not an error.
    }
    throw err;
  }
}

export interface LoginInput {
  loginName: string; // email or Zitadel loginName
  password: string;
}

/**
 * Logs in and relays any Set-Cookie the backend issued (only present when
 * mfaRequired is false and the login completed outright). Callers branch on
 * `mfaRequired`/`availableMethods` to render the TOTP or OTP-email step next.
 */
export async function login(input: LoginInput): Promise<LoginResponse> {
  if (SOURCE === "mock") {
    const user = authenticateMockUser(input.loginName, input.password);
    // A mock user who's gone through the real TOTP enrollment flow (see
    // startTotpEnrollment/confirmTotpEnrollment below) genuinely gets
    // challenged here, same as live — flowId doubles as the userId since
    // there's no real Zitadel session-flow concept in mock mode, and
    // loginTotp's mock branch reads it back the same way.
    if (isMockTotpEnabled(user.userId)) {
      return { mfaRequired: true, completed: false, flowId: user.userId, availableMethods: ["Totp"] };
    }
    await setMockSessionCookies(user);
    return { mfaRequired: false, completed: true, flowId: null, availableMethods: [] };
  }
  const { data, setCookieHeaders } = await apiClient.post<unknown>(`${BASE}/login`, {
    // Wire field is "email" (LoginCommand.Email) — confirmed against a live
    // 422 ("Email is required") when this sent "loginName" unchanged.
    // loginName stays this function's own param name since it may end up
    // meaning "email or Zitadel loginName" once non-email logins exist.
    body: { email: input.loginName, password: input.password },
    withCredentials: false,
  });
  await relayCookies(setCookieHeaders);
  return LoginResponseSchema.parse(data);
}

export async function loginTotp(flowId: string, code: string): Promise<void> {
  if (SOURCE === "mock") {
    // flowId is the userId here — see login()'s mock branch above.
    const user = findMockUserById(flowId);
    if (!user || !validateMockTotpCode(user.userId, code)) {
      throw new ApiError(401, "That code didn't match. Check your authenticator app and try again.");
    }
    await setMockSessionCookies(user);
    return;
  }
  const { setCookieHeaders } = await apiClient.post<unknown>(`${BASE}/login/totp`, {
    body: { flowId, code },
    withCredentials: false,
  });
  await relayCookies(setCookieHeaders);
}

export async function loginStartOtpEmail(flowId: string): Promise<{ maskedEmail: string }> {
  if (SOURCE === "mock") {
    throw new ApiError(501, "MFA is not modeled in mock mode.");
  }
  const { data } = await apiClient.post<unknown>(`${BASE}/login/otp-email/start`, {
    body: { flowId },
    withCredentials: false,
  });
  return LoginOtpEmailStartResponseSchema.parse(data);
}

export async function loginVerifyOtpEmail(flowId: string, code: string): Promise<void> {
  if (SOURCE === "mock") {
    throw new ApiError(501, "MFA is not modeled in mock mode.");
  }
  const { setCookieHeaders } = await apiClient.post<unknown>(`${BASE}/login/otp-email/verify`, {
    body: { flowId, code },
    withCredentials: false,
  });
  await relayCookies(setCookieHeaders);
}

export async function resendLoginOtpEmail(flowId: string): Promise<void> {
  if (SOURCE === "mock") {
    throw new ApiError(501, "MFA is not modeled in mock mode.");
  }
  await apiClient.post(`${BASE}/login/otp-email/resend`, { body: { flowId }, withCredentials: false });
}

/**
 * Reads the current user for display in a Server Component (dashboard shell,
 * nav). NOT the security boundary — that's lib/auth/dal.ts's local JWT
 * verification. This is purely a data read, and can fail (401) if the access
 * token expired between the DAL check and this call; callers should treat a
 * null return as "render nothing identity-specific," not as an auth failure.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (SOURCE === "mock") {
    const session = await verifySession();
    if (!session) {
      return null;
    }
    // Re-reads the mock store (not just the JWT claims) so a freshly-registered
    // user's phone number shows up here too, matching the live /auth/me contract
    // of returning the current record rather than a snapshot from login time.
    const user = findMockUserById(session.userId);
    if (!user) {
      return null;
    }
    return CurrentUserResponseSchema.parse({
      userId: user.userId,
      email: user.email,
      phone: user.phone ?? null,
      displayName: user.displayName,
      accountType: user.accountType,
    });
  }
  try {
    const { data } = await apiClient.get<unknown>(`${BASE}/me`);
    return CurrentUserResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}

/**
 * Calls the backend's refresh endpoint and relays the rotated cookies. Only
 * callable from a Route Handler (app/api/auth/refresh) or Server Action — never
 * from a Server Component render. Returns false if the refresh token was invalid
 * or expired (caller should redirect to /login).
 */
export async function refreshSession(): Promise<boolean> {
  if (SOURCE === "mock") {
    return rotateMockSession();
  }
  try {
    const { setCookieHeaders } = await apiClient.post<unknown>(`${BASE}/refresh`);
    await relayCookies(setCookieHeaders);
    return true;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return false;
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  if (SOURCE === "mock") {
    await clearMockSessionCookies();
    return;
  }
  const { setCookieHeaders } = await apiClient.post<unknown>(`${BASE}/logout`);
  await relayCookies(setCookieHeaders);
}

/** Terminates every Zitadel session for the current user, not just this
 * browser's — the mock branch can only clear this one cookie (there's no
 * concept of "other devices" in the mock store), so it's an honest
 * best-effort rather than a faithful simulation. */
export async function logoutAllDevices(): Promise<void> {
  if (SOURCE === "mock") {
    await clearMockSessionCookies();
    return;
  }
  const { setCookieHeaders } = await apiClient.post<unknown>(`${BASE}/logout-all`);
  await relayCookies(setCookieHeaders);
}

/**
 * Password reset — request/confirm sends delegate to Zitadel on the backend
 * (RequestPasswordResetHandler/ConfirmPasswordResetHandler both call
 * IZitadelAuthService directly), which emails the code itself; this app
 * never sees it. ForgotPassword always resolves (backend returns 204
 * unconditionally, "to avoid revealing whether the email is registered"),
 * so there's no separate not-found error to surface here. Mock mode has no
 * real user-facing email to send the code to, so both throw rather than
 * pretend a code exists — same honesty as the OTP-email login functions.
 */
export async function forgotPassword(email: string): Promise<void> {
  if (SOURCE === "mock") {
    return;
  }
  await apiClient.post(`${BASE}/forgot-password`, { body: { email }, withCredentials: false });
}

export async function resetPassword(userId: string, code: string, newPassword: string): Promise<void> {
  if (SOURCE === "mock") {
    throw new ApiError(501, "Password reset isn't modeled in mock mode — there's no real email to receive a code on.");
  }
  await apiClient.post(`${BASE}/reset-password`, { body: { userId, code, newPassword }, withCredentials: false });
}

/** Email verification — same "delegates to Zitadel, emails a code, mock has
 * nowhere to send it" situation as password reset above. */
export async function verifyEmail(userId: string, code: string): Promise<void> {
  if (SOURCE === "mock") {
    throw new ApiError(501, "Email verification isn't modeled in mock mode.");
  }
  await apiClient.post(`${BASE}/verify-email`, { body: { userId, code }, withCredentials: false });
}

export async function resendVerificationEmail(userId: string): Promise<void> {
  if (SOURCE === "mock") {
    throw new ApiError(501, "Email verification isn't modeled in mock mode.");
  }
  await apiClient.post(`${BASE}/resend-verification`, { body: { userId }, withCredentials: false });
}

export interface TotpEnrollment {
  /** otpauth:// URI — render as a QR code for an authenticator app to scan. */
  uri: string;
  /** Raw secret, for manual entry when a QR code can't be scanned. */
  secret: string;
}

const TotpEnrollmentSchema = z.object({ uri: z.string(), secret: z.string() });

/**
 * Authenticator-app (TOTP) enrollment for the *currently signed-in* user —
 * unlike login()/register(), these three are authenticated calls (the
 * backend reads the user id off the access token, not a request body).
 * Mock mode is fully real here (lib/api/mocks/security-store.ts), not a
 * stub — no email delivery is involved, so there's nothing mock mode can't
 * faithfully reproduce: a real secret, a real otpauth:// URI, real code
 * validation with the same time-window tolerance the live backend/an actual
 * authenticator app both use.
 */
export async function startTotpEnrollment(): Promise<TotpEnrollment> {
  if (SOURCE === "mock") {
    const session = await verifySession();
    if (!session) throw new ApiError(401, "Not signed in.");
    return startMockTotpEnrollment(session.userId, session.email);
  }
  const { data } = await apiClient.post<unknown>(`${BASE}/mfa/totp/setup`);
  return TotpEnrollmentSchema.parse(data);
}

export async function confirmTotpEnrollment(code: string): Promise<void> {
  if (SOURCE === "mock") {
    const session = await verifySession();
    if (!session) throw new ApiError(401, "Not signed in.");
    confirmMockTotpEnrollment(session.userId, code);
    return;
  }
  await apiClient.post(`${BASE}/mfa/totp/verify`, { body: { code } });
}

export async function removeTotp(): Promise<void> {
  if (SOURCE === "mock") {
    const session = await verifySession();
    if (!session) throw new ApiError(401, "Not signed in.");
    removeMockTotp(session.userId);
    return;
  }
  await apiClient.delete(`${BASE}/mfa/totp`);
}

/**
 * Whether the current user has an authenticator app enrolled — real,
 * server-tracked truth in mock mode; a best-effort UI hint in live mode
 * since no backend endpoint reports this (see lib/auth/totp-hint.ts).
 */
export async function getTotpEnabled(): Promise<boolean> {
  if (SOURCE === "mock") {
    const session = await verifySession();
    return session ? isMockTotpEnabled(session.userId) : false;
  }
  return getTotpHint();
}
