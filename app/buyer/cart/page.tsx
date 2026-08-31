import { requireAccountType } from "@/lib/auth/dal";
import { CartView } from "@/components/buyer/cart-view";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Guard lives here (not just in app/buyer/layout.tsx) even though the
 * actual cart UI is client-only — see components/buyer/cart-view.tsx. Open
 * to Vendor sessions too — see route-groups.ts's isBuyerPathOpenToVendors. */
export default async function CartPage() {
  await requireAccountType("buyer", "/buyer/cart", ["Vendor"]);
  return <CartView />;
}
