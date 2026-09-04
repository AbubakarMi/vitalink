import { MarketplaceHeader } from "@/components/marketplace/marketplace-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { verifySession } from "@/lib/auth/dal";
import { getCurrentUser } from "@/lib/api/auth";
import { DashboardShell } from "@/components/customer/dashboard-shell";

// Genuinely dynamic (verifySession reads cookies) — not prerenderable for
// anyone, guest included. That's the deliberate tradeoff: a signed-in customer
// gets their real dashboard shell (sidebar, cart count, account menu) on
// this exact URL instead of a second /customer/catalog duplicate that drops
// the sidebar the moment they browse the catalog — one route, chrome
// chosen by who's looking at it, same idea as proxy.ts choosing behavior
// by session rather than duplicating routes per role.
export const instant = false;

export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();

  if (session?.accountType === "Customer") {
    const user = await getCurrentUser();
    return <DashboardShell customerName={user?.displayName ?? "Customer"}>{children}</DashboardShell>;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <MarketplaceHeader />
      <div className="flex-1 space-y-6 py-6">{children}</div>
      <SiteFooter />
    </div>
  );
}
