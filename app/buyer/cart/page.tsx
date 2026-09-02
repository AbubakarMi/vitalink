import { requireAccountType } from "@/lib/auth/dal";
import { CartView } from "@/components/buyer/cart-view";
import { LiveCartView } from "@/components/buyer/live-cart-view";
import { MARKETPLACE_LIVE } from "@/lib/api/marketplace";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Guard lives here (not just in app/buyer/layout.tsx) even though the
 * actual cart UI is client-only — see components/buyer/cart-view.tsx. Open
 * to Vendor sessions too — see route-groups.ts's isBuyerPathOpenToVendors.
 * Branches to the real, backend-priced cart (components/buyer/live-cart-view.tsx)
 * once PRODUCTS_DATA_SOURCE=live — the mock catalog's "Add to Cart" writes
 * to lib/cart/store.tsx (localStorage), the live Buy Box's writes to the
 * real cart, so the two aren't the same data and can't share one view. */
export default async function CartPage() {
  await requireAccountType("buyer", "/buyer/cart", ["Vendor"]);
  return MARKETPLACE_LIVE ? <LiveCartView /> : <CartView />;
}
