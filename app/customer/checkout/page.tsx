import { requireAccountType } from "@/lib/auth/dal";
import { listAddresses } from "@/lib/api/addresses";
import { CheckoutView } from "@/components/customer/checkout-view";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/**
 * Open to Vendor sessions too — see route-groups.ts's isCustomerPathOpenToVendors.
 * listAddresses() is Customer-scoped on the real backend (Web.Api/Endpoints/
 * Customer/*, RequirePermission on the Customers resource) — a Vendor
 * session has no customer address book at all, so this swallows that
 * failure rather than crashing checkout for a vendor buying as a shopper;
 * they just see the same "no saved address yet" prompt a brand-new customer
 * would (components/customer/checkout-view.tsx).
 */
export default async function CheckoutPage() {
  await requireAccountType("customer", "/customer/checkout", ["Vendor"]);
  const addresses = await listAddresses().catch(() => []);
  return <CheckoutView initialAddresses={addresses} />;
}
