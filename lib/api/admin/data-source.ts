import "server-only";

/**
 * "mock" (default) | "live" — flips every lib/api/admin/*.ts adapter between
 * lib/api/mocks/admin-store.ts and the real backend, same seam as
 * PRODUCTS_DATA_SOURCE/VENDOR_PROFILE_DATA_SOURCE. One shared guard (not
 * duplicated per file the way auth.ts/vendor-profile.ts each have their own
 * copy) since six admin adapters all need the exact same check.
 */
export const ADMIN_SOURCE = process.env.ADMIN_DATA_SOURCE ?? "mock";

const ALLOW_MOCK_IN_PRODUCTION = process.env.ALLOW_MOCK_IN_PRODUCTION === "true";

if (ADMIN_SOURCE === "mock" && process.env.NODE_ENV === "production" && !ALLOW_MOCK_IN_PRODUCTION) {
  throw new Error(
    "ADMIN_DATA_SOURCE is still 'mock' in a production build. This fails the build on " +
      "purpose, mirroring AUTH_DATA_SOURCE's guard in lib/api/auth.ts. Set " +
      "ADMIN_DATA_SOURCE=live once the real backend is reachable, or set " +
      "ALLOW_MOCK_IN_PRODUCTION=true for a throwaway demo deploy. See docs/MOCK_AUTH.md.",
  );
}
