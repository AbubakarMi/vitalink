import "server-only";
import { z } from "zod";
import { apiClient, ApiError } from "./client";
import { relayCookies } from "./cookie-relay";

/**
 * Adapter over the real, already-shipped Zitadel-backed auth endpoints (see
 * vitalink-backend Web.Api/Endpoints/Authentication/AuthenticationEndpoints.cs).
 * Plain server-only functions, not "use server" Server Actions — thin Server
 * Action wrappers get colocated with the actual login/register forms when that UI
 * is built; this file is the typed, validated boundary they'll call into.
 */

const BASE = "/auth";

export const AccountTypeSchema = z.enum(["Customer", "Vendor", "Staff"]);
export type AccountType = z.infer<typeof AccountTypeSchema>;

// C# enums here are assumed to serialize as strings (JsonStringEnumConverter) per
// modern ASP.NET Core convention — not observed against a live response. Flag and
// fix if the real payload turns out to send integers instead.
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
  accountType: AccountTypeSchema,
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
  const { data } = await apiClient.post<unknown>(`${BASE}/register`, {
    body: input,
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
  const { data, setCookieHeaders } = await apiClient.post<unknown>(`${BASE}/login`, {
    body: input,
    withCredentials: false,
  });
  await relayCookies(setCookieHeaders);
  return LoginResponseSchema.parse(data);
}

export async function loginTotp(flowId: string, code: string): Promise<void> {
  const { setCookieHeaders } = await apiClient.post<unknown>(`${BASE}/login/totp`, {
    body: { flowId, code },
    withCredentials: false,
  });
  await relayCookies(setCookieHeaders);
}

export async function loginStartOtpEmail(flowId: string): Promise<{ maskedEmail: string }> {
  const { data } = await apiClient.post<unknown>(`${BASE}/login/otp-email/start`, {
    body: { flowId },
    withCredentials: false,
  });
  return LoginOtpEmailStartResponseSchema.parse(data);
}

export async function loginVerifyOtpEmail(flowId: string, code: string): Promise<void> {
  const { setCookieHeaders } = await apiClient.post<unknown>(`${BASE}/login/otp-email/verify`, {
    body: { flowId, code },
    withCredentials: false,
  });
  await relayCookies(setCookieHeaders);
}

export async function resendLoginOtpEmail(flowId: string): Promise<void> {
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
  const { setCookieHeaders } = await apiClient.post<unknown>(`${BASE}/logout`);
  await relayCookies(setCookieHeaders);
}
