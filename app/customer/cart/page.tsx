import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { dashboardPathForAccountType } from "@/lib/auth/route-groups";
import { CartView } from "@/components/customer/cart-view";
import { LiveCartView } from "@/components/customer/live-cart-view";
import { MARKETPLACE_LIVE } from "@/lib/api/marketplace";

export const instant = false; // verifySession reads cookies — genuinely dynamic

/**
 * Guard lives here (not just in app/customer/layout.tsx) even though the
 * actual cart UI is client-only — see components/customer/cart-view.tsx.
 *
 * Unlike every other /customer/* page, this one is deliberately guest-
 * accessible (route-groups.ts's isGuestAllowedCustomerPath, mirrored in
 * proxy.ts) — same as any real storefront, holding a cart doesn't need an
 * account, only paying for it does (app/customer/checkout/page.tsx keeps the
 * hard requireAccountType). A signed-in session still has to be the right
 * role (Customer or Vendor — see route-groups.ts's isCustomerPathOpenToVendors)
 * or it gets sent to its own dashboard. isAuthenticated is threaded down so
 * the "Proceed to Checkout" CTA can prompt a guest to log in/register
 * instead of just bouncing them (components/customer/checkout-cta.tsx).
 *
 * Branches to the real, backend-priced cart (components/customer/live-cart-view.tsx)
 * once PRODUCTS_DATA_SOURCE=live — the mock catalog's "Add to Cart" writes
 * to lib/cart/store.tsx (localStorage), the live Buy Box's writes to the
 * real cart, so the two aren't the same data and can't share one view.
 */
export default async function CartPage() {
  const session = await verifySession();

  if (session && session.accountType !== "Customer" && session.accountType !== "Vendor") {
    redirect(dashboardPathForAccountType(session.accountType));
  }

  const isAuthenticated = Boolean(session);
  return MARKETPLACE_LIVE ? (
    <LiveCartView isAuthenticated={isAuthenticated} />
  ) : (
    <CartView isAuthenticated={isAuthenticated} />
  );
}
