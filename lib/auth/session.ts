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

/**
 * The backend stores/emits account type as lowercase
 * (Infrastructure/Zitadel/Services/ZitadelRegistrationService.cs:
 * `request.AccountType.FastToString().ToLowerInvariant()`, written into
 * Zitadel user metadata and read back verbatim — both as the `account_type`
 * JWT claim and as GetCurrentUserResponse's `accountType` field, since both
 * come from the same Infrastructure/Zitadel/Services/ZitadelUserService.cs
 * `GetAccountTypeAsync()` helper — not the PascalCase this app's own
 * AccountType values use everywhere else. Also confirmed live, not just a
 * defensive guess: the seeded default super-admin user
 * (Infrastructure/Persistence/VitalinkDbInitializer.cs's `admin@vitalink.tech`)
 * is created with no "account_type" metadata at all — `GetAccountTypeAsync`'s
 * fallback for that (a metadata lookup that legitimately finds nothing, not
 * an error) is the literal string "admin", mapped to "Staff" here since
 * that's this app's own account type for admin-panel access.
 *
 * Exported so lib/api/auth.ts's getCurrentUser() can apply the exact same
 * normalization to GetCurrentUserResponse.accountType — it's the same raw
 * value, just reached over HTTP instead of via a JWT claim, and needs the
 * same fix or a real account (like that seeded super-admin) fails Zod
 * validation there too.
 */
const ACCOUNT_TYPE_ALIASES: Record<string, AccountType> = {
  customer: "Customer",
  vendor: "Vendor",
  staff: "Staff",
  admin: "Staff",
};

export function normalizeAccountType(value: unknown): AccountType | null {
  if (typeof value !== "string") return null;
  return ACCOUNT_TYPE_ALIASES[value.toLowerCase()] ?? null;
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

/** .NET's `ClaimTypes.Role` constant IS this full URI — that's the literal JSON
 * key the JWT carries one role under, not "role"/"roles" (confirmed against
 * Infrastructure/Authentication/Services/JwtCookieService.cs's
 * `new Claim(ClaimTypes.Role, role)` for each of the user's roles). A JWT claims
 * set serializes a single value as a bare value and multiple as an array, so a
 * user with exactly one role needs the non-array branch below. */
export const ROLE_CLAIM_KEY = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

/**
 * Verifies the backend's access-token JWT and extracts the claims this app cares
 * about. Pure/stateless (no network or DB calls) — safe to call from proxy.ts's
 * optimistic check as well as the authoritative DAL (lib/auth/dal.ts).
 *
 * Claim names confirmed against source
 * (Infrastructure/Authentication/Services/JwtCookieService.cs's
 * CreateAccessToken and Shared/Identity/AppClaims.cs) — see
 * docs/BACKEND_INTEGRATION_GUIDE.md §2.3 for the full before/after. No `userId`,
 * `displayName`, `roles`, or `accountType` claim exists; the real keys are
 * `sub`, `name`, the role-claim URI above, and `account_type`.
 */
export async function verifyAccessToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSigningKey(), {
      algorithms: ["HS256"],
      // `|| undefined`, not the bare env var: jose treats a *defined* issuer/audience
      // option (even "") as "the token's iss/aud claim must equal that string", so a
      // blank-but-set env var would reject every token that (correctly) omits the
      // claim entirely — verifyAccessToken would then read every session as logged
      // out. undefined is what actually means "don't check this claim".
      issuer: process.env.AUTH_JWT_ISSUER || undefined,
      audience: process.env.AUTH_JWT_AUDIENCE || undefined,
    });

    const accountType = normalizeAccountType(payload.account_type);
    if (!accountType) {
      return null;
    }

    const roles = payload[ROLE_CLAIM_KEY];

    return {
      userId: String(payload.sub ?? ""),
      email: String(payload.email ?? ""),
      displayName: String(payload.name ?? ""),
      accountType,
      roles: Array.isArray(roles) ? roles.map(String) : roles ? [String(roles)] : [],
    };
  } catch {
    // Expired, malformed, or signature mismatch — all treated the same by callers.
    return null;
  }
}
