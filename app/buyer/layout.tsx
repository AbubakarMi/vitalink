import { requireAccountType } from "@/lib/auth/dal";
import { getCurrentUser } from "@/lib/api/auth";
import { DashboardShell } from "@/components/buyer/dashboard-shell";
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/**
 * Buyer shell. The AccountType==="Customer" check here is a UX convenience
 * (avoids flashing the full buyer nav before redirecting); it is NOT the
 * security boundary — each page.tsx also calls requireAccountType("buyer",
 * ...) directly, since layouts don't reliably re-run on every client-side
 * navigation (design doc §2.2). Unlike vendor, there's no profile/
 * verification gate — a buyer account is usable immediately after signup.
 *
 * Allows Vendor sessions through too (alsoAllow) because /buyer/cart and
 * /buyer/checkout are open to them — a vendor can buy on the marketplace
 * like any other shopper (route-groups.ts's isBuyerPathOpenToVendors). A
 * vendor here only ever reached one of those two — every other /buyer/*
 * page's own requireAccountType("buyer", ...) call (no alsoAllow) redirects
 * them away before render. They get the same guest/shopper chrome as
 * (marketplace)/layout.tsx uses for anyone not signed in as a Customer,
 * not the buyer account dashboard.
 */
export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAccountType("buyer", "/buyer/dashboard", ["Vendor"]);

  if (session.accountType === "Vendor") {
    return (
      <div className="flex min-h-dvh flex-col bg-cream">
        <MarketplaceHeader />
        <div className="flex-1 space-y-6 py-6">{children}</div>
        <SiteFooter />
      </div>
    );
  }

  const user = await getCurrentUser();
  return <DashboardShell buyerName={user?.displayName ?? "Buyer"}>{children}</DashboardShell>;
}
