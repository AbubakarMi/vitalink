import { MarketplaceHeader } from "@/components/marketplace/marketplace-header";
import { SiteFooter } from "@/components/marketing/site-footer";

// No auth check: the marketplace listing is public (design doc §2.1), same
// as (marketing) — split into its own group only because it needs a
// different header (Cart + Login vs Browse Products + Sign Up).
export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <MarketplaceHeader />
      <div className="flex-1 space-y-6 py-6">{children}</div>
      <SiteFooter />
    </div>
  );
}
