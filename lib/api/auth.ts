import "server-only";
import { z } from "zod";
import { apiClient, ApiError } from "./client";
import { relayCookies } from "./cookie-relay";
import {
  authenticateMockUser,
  clearMockSessionCookies,
  createMockUser,
  findMockUserById,
  rotateMockSession,
  setMockSessionCookies,
} from "./mocks/auth-store";
import { verifySession } from "@/lib/auth/dal";
import { normalizeAccountType } from "@/lib/auth/session";

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
    // Auto-verified: this app has no verify-email page/action yet, so requiring
    // a real verification step would be a dead end in mock mode.
    const user = createMockUser(input);
    return { userId: user.userId, verificationEmailSent: true };
  }
  const { data } = await apiClient.post<unknown>(`${BASE}/register`, {
    body: { ...input, accountType: ACCOUNT_TYPE_ORDINAL[input.accountType] },
    withCredentials: false,
  });
  return RegisterResponseSchema.parse(data);
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
    // No seeded/created mock user carries MFA, so this always completes outright —
    // see loginTotp/loginStartOtpEmail below for why MFA isn't modeled in mock mode.
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
    // Unreachable from the current UI (no mock user ever returns mfaRequired:
    // true from login()), but kept honest rather than silently no-op-ing.
    throw new ApiError(501, "MFA is not modeled in mock mode.");
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
