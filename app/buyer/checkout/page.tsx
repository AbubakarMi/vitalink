import { requireAccountType } from "@/lib/auth/dal";
import { getDeliveryAddress } from "@/lib/api/buyer-profile";
import { CheckoutView } from "@/components/buyer/checkout-view";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Open to Vendor sessions too — see route-groups.ts's isBuyerPathOpenToVendors. */
export default async function CheckoutPage() {
  await requireAccountType("buyer", "/buyer/checkout", ["Vendor"]);
  const address = await getDeliveryAddress();
  return <CheckoutView initialAddress={address} />;
}
