import type { AccountType } from "./session";

/**
 * Maps the backend's AccountType enum (Customer | Vendor | Staff) to this app's
 * product-language path prefixes (/buyer, /vendor, /admin). These names do not
 * match on purpose — one is a backend identity concept, the other is UX language —
 * so the mapping lives here, once, and nothing else re-derives or string-compares
 * it ad hoc. See design doc §2.3.
 */
export const PATH_PREFIX_ACCOUNT_TYPE = {
  buyer: "Customer",
  vendor: "Vendor",
  admin: "Staff",
} satisfies Record<string, AccountType>;

export type ProtectedPathPrefix = keyof typeof PATH_PREFIX_ACCOUNT_TYPE;

/**
 * A vendor is still a shopper — same as any Jumia seller can buy on the main
 * marketplace with their own account — so these two /buyer paths (and their
 * subpaths, e.g. /buyer/checkout/success) also accept a Vendor session, on
 * top of the required Customer one. Every other /buyer/* path (dashboard,
 * orders, settings, chats) stays Customer-only — a vendor has its own
 * equivalents under /vendor/*.
 */
const BUYER_PATHS_OPEN_TO_VENDORS = ["/buyer/cart", "/buyer/checkout"];

export function isBuyerPathOpenToVendors(pathname: string): boolean {
  return BUYER_PATHS_OPEN_TO_VENDORS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

const DASHBOARD_PATH: Record<ProtectedPathPrefix, string> = {
  buyer: "/buyer/dashboard",
  vendor: "/vendor/dashboard",
  admin: "/admin/dashboard",
};

/** Returns the protected prefix a pathname belongs to, or null if it's public. */
export function matchProtectedPrefix(pathname: string): ProtectedPathPrefix | null {
  for (const prefix of Object.keys(PATH_PREFIX_ACCOUNT_TYPE) as ProtectedPathPrefix[]) {
    if (pathname === `/${prefix}` || pathname.startsWith(`/${prefix}/`)) {
      return prefix;
    }
  }
  return null;
}

/** Returns the dashboard path for an account type, used when redirecting a signed-in
 * user away from a route that belongs to a different role. */
export function dashboardPathForAccountType(accountType: AccountType): string {
  const prefix = (Object.entries(PATH_PREFIX_ACCOUNT_TYPE) as [ProtectedPathPrefix, AccountType][]).find(
    ([, type]) => type === accountType,
  )?.[0];
  return prefix ? DASHBOARD_PATH[prefix] : "/";
}
