import "server-only";

/**
 * In-memory, per-user MFA preference — globalThis-pinned so Next dev/
 * Turbopack module re-evaluation doesn't wipe it (same idiom as
 * auth-store.ts, support-store.ts). No live endpoint exists yet for
 * enrolling a user in MFA (lib/api/auth.ts's loginTotp/loginStartOtpEmail
 * comments: "MFA is not modeled in mock mode") — this is a real, saved
 * preference, not a fabricated "active" security setting. It doesn't (yet)
 * change what login actually requires.
 */

export type MfaMethod = "none" | "email" | "authenticator";

export interface MfaPreference {
  method: MfaMethod;
  updatedAt: string;
}

const globalForSecurity = globalThis as unknown as {
  __vitalinkMfaPreferences?: Map<string, MfaPreference>;
};
const preferences = globalForSecurity.__vitalinkMfaPreferences ?? new Map<string, MfaPreference>();
globalForSecurity.__vitalinkMfaPreferences = preferences;

export function getMockMfaPreference(userId: string): MfaPreference {
  return preferences.get(userId) ?? { method: "none", updatedAt: new Date(0).toISOString() };
}

export function setMockMfaPreference(userId: string, method: MfaMethod): MfaPreference {
  const record: MfaPreference = { method, updatedAt: new Date().toISOString() };
  preferences.set(userId, record);
  return record;
}
