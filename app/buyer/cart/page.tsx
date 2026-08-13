import { requireAccountType } from "@/lib/auth/dal";
import { CartView } from "@/components/buyer/cart-view";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Guard lives here (not just in app/buyer/layout.tsx) even though the
 * actual cart UI is client-only — see components/buyer/cart-view.tsx. */
export default async function CartPage() {
  await requireAccountType("buyer", "/buyer/cart");
  return <CartView />;
}
