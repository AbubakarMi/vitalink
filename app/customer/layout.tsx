import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { dashboardPathForAccountType } from "@/lib/auth/route-groups";
import { getCurrentUser } from "@/lib/api/auth";
import { DashboardShell } from "@/components/customer/dashboard-shell";
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export const instant = false; // verifySession reads cookies — genuinely dynamic

/**
 * Customer shell. The AccountType==="Customer" check here is a UX convenience
 * (avoids flashing the full customer nav before redirecting); it is NOT the
 * security boundary — each page.tsx also calls requireAccountType("customer",
 * ...) directly, since layouts don't reliably re-run on every client-side
 * navigation (design doc §2.2). Unlike vendor, there's no profile/
 * verification gate — a customer account is usable immediately after signup.
 *
 * Allows Vendor sessions through too because /customer/cart, /customer/checkout,
 * and /customer/orders are open to them — a vendor can buy on the marketplace
 * and track their own purchases like any other shopper (route-groups.ts's
 * isCustomerPathOpenToVendors). A vendor here only ever reaches one of those
 * three — every other /customer/* page's own requireAccountType("customer", ...)
 * call (no alsoAllow) redirects them away before render.
 *
 * Also renders through with NO session at all — /customer/cart is guest-
 * accessible (route-groups.ts's isGuestAllowedCustomerPath, same reasoning as
 * any real storefront: browsing/holding a cart needs no account). This is
 * safe without knowing which page is being rendered because proxy.ts
 * already filters at the middleware level: an anonymous request only ever
 * reaches this far for that one allowed path — every other /customer/* path
 * gets redirected to /login before this layout runs at all. A guest (or a
 * Vendor) gets the same guest/shopper chrome as (marketplace)/layout.tsx
 * uses for anyone not signed in as a Customer, not the customer account
 * dashboard.
 */
export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();

  if (session && session.accountType !== "Customer" && session.accountType !== "Vendor") {
    redirect(dashboardPathForAccountType(session.accountType));
  }

  if (!session || session.accountType === "Vendor") {
    return (
      <div className="flex min-h-dvh flex-col bg-cream">
        <MarketplaceHeader />
        <div className="flex-1 space-y-6 py-6">{children}</div>
        <SiteFooter />
      </div>
    );
  }

  const user = await getCurrentUser();
  return <DashboardShell customerName={user?.displayName ?? "Customer"}>{children}</DashboardShell>;
}
