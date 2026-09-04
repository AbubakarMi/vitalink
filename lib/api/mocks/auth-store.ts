import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { ApiError } from "../client";
import { SESSION_COOKIES, ROLE_CLAIM_KEY, type AccountType } from "@/lib/auth/session";

/**
 * In-memory stand-in for the Zitadel-backed user store, used while
 * AUTH_DATA_SOURCE=mock (see lib/api/auth.ts). Lives only for the lifetime of
 * this Node process — restarting `next dev`/`next start` resets every account
 * created through the mock register form back to the seeded demo users
 * below. That's an accepted limitation for a mock, not a bug; see
 * docs/MOCK_AUTH.md.
 *
 * Mints its own JWTs with the same AUTH_JWT_SIGNING_KEY the real backend
 * would use, so lib/auth/session.ts's verifyAccessToken (which proxy.ts and
 * lib/auth/dal.ts both call) needs zero changes to accept mock sessions.
 */

export interface MockUserRecord {
  userId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone?: string;
  accountType: AccountType;
  roles: string[];
}

// Pinned to globalThis, not a plain module-level `new Map()`: Next.js dev-mode
// Turbopack/Fast Refresh re-evaluates server modules on unrelated file edits far
// more often than a real process restart happens, which would otherwise wipe every
// account created mid-session even though the browser's session cookie (a real
// signed JWT, verified independently in lib/auth/session.ts) survives just fine.
// Same idiom Next.js's own docs recommend for a dev-mode Prisma Client singleton.
const globalForMockAuth = globalThis as unknown as { __vitalinkMockUsers?: Map<string, MockUserRecord> };
const usersByEmail = globalForMockAuth.__vitalinkMockUsers ?? new Map<string, MockUserRecord>();
globalForMockAuth.__vitalinkMockUsers = usersByEmail;

function seedUser(user: Omit<MockUserRecord, "userId" | "displayName">): void {
  usersByEmail.set(user.email, {
    ...user,
    userId: randomUUID(),
    displayName: `${user.firstName} ${user.lastName}`,
  });
}

function seedDemoUsersOnce(): void {
  if (usersByEmail.size > 0) {
    return;
  }
  seedUser({
    email: "customer@vitalink.dev",
    password: "Password1!",
    firstName: "Ada",
    lastName: "Customer",
    phone: "+2348000000001",
    accountType: "Customer",
    roles: ["Customer"],
  });
  seedUser({
    email: "vendor@vitalink.dev",
    password: "Password1!",
    firstName: "Femi",
    lastName: "Vendor",
    phone: "+2348000000002",
    accountType: "Vendor",
    roles: ["Vendor"],
  });
  seedUser({
    email: "staff@vitalink.dev",
    password: "Password1!",
    firstName: "Sam",
    lastName: "Staff",
    accountType: "Staff",
    roles: ["Staff"],
  });
}
seedDemoUsersOnce();

export function findMockUserByEmail(email: string): MockUserRecord | undefined {
  return usersByEmail.get(email.toLowerCase());
}

/** Every mock account, regardless of type — admin's Customers list
 * (lib/api/mocks/admin-store.ts) filters this down to accountType
 * "Customer" itself, same as it already does for vendors/staff elsewhere. */
export function listMockUsers(): MockUserRecord[] {
  return Array.from(usersByEmail.values());
}

export function findMockUserById(userId: string): MockUserRecord | undefined {
  for (const user of usersByEmail.values()) {
    if (user.userId === userId) {
      return user;
    }
  }
  return undefined;
}

export interface CreateMockUserInput {
  email: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  accountType: AccountType;
}

/** Throws ApiError(409) on a duplicate email, matching the real backend's
 * conflict response so registerAction's existing error handling (lib/api/auth.ts
 * callers check `error.status === 409`) works unchanged in mock mode. */
export function createMockUser(input: CreateMockUserInput): MockUserRecord {
  const email = input.email.toLowerCase();
  if (usersByEmail.has(email)) {
    throw new ApiError(409, "An account with that email already exists.");
  }

  const user: MockUserRecord = {
    userId: randomUUID(),
    email,
    password: input.password,
    firstName: input.firstName,
    lastName: input.lastName,
    displayName: `${input.firstName} ${input.lastName}`,
    phone: input.phone,
    accountType: input.accountType,
    roles: [input.accountType],
  };
  usersByEmail.set(email, user);
  return user;
}

/** Throws ApiError(401) on a bad email/password, matching the real backend. */
export function authenticateMockUser(loginName: string, password: string): MockUserRecord {
  const user = usersByEmail.get(loginName.toLowerCase());
  if (!user || user.password !== password) {
    throw new ApiError(401, "Incorrect email or password.");
  }
  return user;
}

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

function signingKey(): Uint8Array {
  const key = process.env.AUTH_JWT_SIGNING_KEY;
  if (!key) {
    throw new Error(
      "AUTH_JWT_SIGNING_KEY is not set. The mock auth store still needs it to mint tokens " +
        "that lib/auth/session.ts's verifyAccessToken can verify locally — set any value in " +
        ".env.local (it only has to match itself while AUTH_DATA_SOURCE=mock). See docs/MOCK_AUTH.md.",
    );
  }
  return new TextEncoder().encode(key);
}

async function signToken(payload: Record<string, unknown>, ttl: string): Promise<string> {
  let token = new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(ttl);
  if (process.env.AUTH_JWT_ISSUER) {
    token = token.setIssuer(process.env.AUTH_JWT_ISSUER);
  }
  if (process.env.AUTH_JWT_AUDIENCE) {
    token = token.setAudience(process.env.AUTH_JWT_AUDIENCE);
  }
  return token.sign(signingKey());
}

/** __Host- cookies require Secure + no Domain + Path=/ regardless of env — browsers
 * treat localhost as a secure context, so this also works over plain http in dev. */
const COOKIE_BASE = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };

export async function setMockSessionCookies(user: MockUserRecord): Promise<void> {
  const accessToken = await signToken(
    {
      sub: user.userId,
      email: user.email,
      // Claim keys/casing mirror the real backend's token exactly (confirmed
      // against Infrastructure/Authentication/Services/JwtCookieService.cs
      // and Shared/Identity/AppClaims.cs — see lib/auth/session.ts's
      // verifyAccessToken comment) so mock sessions need zero special-casing
      // there: "name" not "displayName", "account_type" (lowercase value)
      // not "accountType", and roles under the full ClaimTypes.Role URI.
      name: user.displayName,
      account_type: user.accountType.toLowerCase(),
      [ROLE_CLAIM_KEY]: user.roles,
    },
    ACCESS_TOKEN_TTL,
  );
  const refreshToken = await signToken({ sub: user.userId, type: "refresh" }, REFRESH_TOKEN_TTL);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIES.accessToken, accessToken, { ...COOKIE_BASE, maxAge: 15 * 60 });
  cookieStore.set(SESSION_COOKIES.refreshToken, refreshToken, { ...COOKIE_BASE, maxAge: 30 * 24 * 60 * 60 });
}

export async function clearMockSessionCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIES.accessToken, "", { ...COOKIE_BASE, maxAge: 0 });
  cookieStore.set(SESSION_COOKIES.refreshToken, "", { ...COOKIE_BASE, maxAge: 0 });
}

/** Rotates the mock session from whatever refresh cookie is present. Mirrors
 * refreshSession()'s live contract: true + rotated cookies, or false (caller
 * redirects to /login) if the refresh token is missing/expired/unknown. */
export async function rotateMockSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(SESSION_COOKIES.refreshToken)?.value;
  if (!refreshToken) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(refreshToken, signingKey(), {
      algorithms: ["HS256"],
      issuer: process.env.AUTH_JWT_ISSUER || undefined,
      audience: process.env.AUTH_JWT_AUDIENCE || undefined,
    });
    if (payload.type !== "refresh") {
      return false;
    }
    const user = findMockUserById(String(payload.sub));
    if (!user) {
      return false;
    }
    await setMockSessionCookies(user);
    return true;
  } catch {
    return false;
  }
}
