import "server-only";
import { ApiError } from "./client";
import { verifySession } from "@/lib/auth/dal";
import { getMockMfaPreference, setMockMfaPreference, type MfaMethod } from "./mocks/security-store";

export type { MfaMethod } from "./mocks/security-store";

/**
 * Account security preferences — currently just the MFA method, moved here
 * from the vendor onboarding wizard's Identity step (see
 * app/(auth)/vendor-apply/vendor-identity-form.tsx) since enrolling in MFA
 * is an account setting, not a registration step. No live enrollment
 * endpoint exists in lib/api/auth.ts yet, so this stays mock-only rather
 * than carrying a SOURCE seam that would have nothing real to flip to.
 */

async function currentUserId(): Promise<string> {
  const session = await verifySession();
  if (!session) {
    throw new ApiError(401, "Not signed in.");
  }
  return session.userId;
}

export async function getMfaPreference() {
  const userId = await currentUserId();
  return getMockMfaPreference(userId);
}

export async function setMfaPreference(method: MfaMethod) {
  const userId = await currentUserId();
  return setMockMfaPreference(userId, method);
}
