import "server-only";
import { jwtVerify } from "jose";

export const SESSION_COOKIES = {
  accessToken: "__Host-access_token",
  refreshToken: "__Host-refresh_token",
} as const;

export const ACCOUNT_TYPES = ["Customer", "Vendor", "Staff"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface SessionClaims {
  userId: string;
  email: string;
  displayName: string;
  accountType: AccountType;
  roles: string[];
}

function isAccountType(value: unknown): value is AccountType {
  return typeof value === "string" && (ACCOUNT_TYPES as readonly string[]).includes(value);
}

function getSigningKey(): Uint8Array {
  const key = process.env.AUTH_JWT_SIGNING_KEY;
  if (!key) {
    throw new Error(
      "AUTH_JWT_SIGNING_KEY is not set. This must match the .NET backend's JwtOptions.SigningKey " +
        "so this app can verify the __Host-access_token cookie locally. See design doc §3.",
    );
  }
  return new TextEncoder().encode(key);
}

/**
 * Verifies the backend's access-token JWT and extracts the claims this app cares
 * about. Pure/stateless (no network or DB calls) — safe to call from proxy.ts's
 * optimistic check as well as the authoritative DAL (lib/auth/dal.ts).
 *
 * Claim names mirror IJwtCookieService.AppUserClaims as of the backend's
 * 2026-08-06 main branch. Confirm these against the real token shape once the
 * backend team finalizes the JWT-minting code — this is a documented assumption,
 * not something observed from a live token.
 */
export async function verifyAccessToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSigningKey(), {
      algorithms: ["HS256"],
      issuer: process.env.AUTH_JWT_ISSUER,
      audience: process.env.AUTH_JWT_AUDIENCE,
    });

    const accountType = payload.accountType ?? payload.AccountType;
    if (!isAccountType(accountType)) {
      return null;
    }

    const roles = payload.roles ?? payload.Roles;

    return {
      userId: String(payload.sub ?? payload.ZitadelUserId ?? ""),
      email: String(payload.email ?? payload.Email ?? ""),
      displayName: String(payload.displayName ?? payload.DisplayName ?? ""),
      accountType,
      roles: Array.isArray(roles) ? roles.map(String) : [],
    };
  } catch {
    // Expired, malformed, or signature mismatch — all treated the same by callers.
    return null;
  }
}
