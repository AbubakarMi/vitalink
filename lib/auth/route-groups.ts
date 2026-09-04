import type { AccountType } from "./session";

/**
 * Maps the backend's AccountType enum (Customer | Vendor | Staff) to this app's
 * path prefixes (/customer, /vendor, /admin) — lowercase path key to the
 * backend's own PascalCase value, "admin" being the one place they still
 * genuinely diverge ("admin" the path vs "Staff" the backend identity
 * concept, since "admin" reads better as UX language than "staff" does).
 * The mapping lives here, once, so nothing else re-derives or
 * string-compares it ad hoc. See design doc §2.3.
 */
export const PATH_PREFIX_ACCOUNT_TYPE = {
  customer: "Customer",
  vendor: "Vendor",
  admin: "Staff",
} satisfies Record<string, AccountType>;

export type ProtectedPathPrefix = keyof typeof PATH_PREFIX_ACCOUNT_TYPE;

/**
 * A vendor is still a shopper — same as any Jumia seller can buy on the main
 * marketplace with their own account — so these /customer paths (and their
 * subpaths, e.g. /customer/checkout/success) also accept a Vendor session, on
 * top of the required Customer one. Every other /customer/* path (dashboard,
 * settings, chats) stays Customer-only — a vendor has its own equivalents
 * under /vendor/*. Orders is the exception: lib/api/customer-orders.ts scopes
 * everything by the signed-in user's own userId regardless of account type,
 * so a vendor's own purchases (as a shopper) show up correctly here without
 * needing a second, parallel order-history implementation under /vendor/*.
 */
const CUSTOMER_PATHS_OPEN_TO_VENDORS = ["/customer/cart", "/customer/checkout", "/customer/orders"];

export function isCustomerPathOpenToVendors(pathname: string): boolean {
  return CUSTOMER_PATHS_OPEN_TO_VENDORS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * The cart itself needs no account — same as any real storefront, browsing
 * and holding items doesn't require signing in, only paying for them does.
 * The backend already mirrors this split (Cart endpoints are
 * `AllowAnonymous()`, `GetCheckoutQuote`/`PlaceOrder` are
 * `RequireAuthorization()`), via a guest cart cookie the backend itself
 * mints. Checkout is deliberately NOT in this list — proxy.ts and
 * requireAccountType still gate it, so a guest reaching /customer/checkout
 * (typed directly, or via the cart page's own login/register prompt) gets
 * sent to log in first.
 */
const GUEST_ALLOWED_CUSTOMER_PATHS = ["/customer/cart"];

export function isGuestAllowedCustomerPath(pathname: string): boolean {
  return GUEST_ALLOWED_CUSTOMER_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

const DASHBOARD_PATH: Record<ProtectedPathPrefix, string> = {
  customer: "/customer/dashboard",
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
