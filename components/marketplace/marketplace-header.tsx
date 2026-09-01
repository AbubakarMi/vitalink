import { Suspense } from "react";
import Link from "next/link";
import { CartIcon } from "@/components/marketplace/cart-icon";
import { SearchBar } from "@/components/marketing/search-bar";
import { AccountSlot, AccountSlotFallback } from "@/components/marketing/account-slot";

/**
 * Header for the marketplace/products listing + detail pages. Restyled to
 * match the client's Ezerhealthcare/HealthBank EHR reference: a light cream
 * bar with dark-green accents, same as SiteHeader on the landing page.
 *
 * The design shows a hardcoded cart count ("85") and a notification bell
 * with a fabricated "99" badge — both Figma placeholder data. CartIcon shows
 * the real client-side cart count; there's no notification system on the
 * backend yet so the bell is omitted rather than showing a fake count. The
 * account slot (Login vs. account menu) is components/marketing/account-slot.tsx,
 * shared with SiteHeader — see that file for why a signed-in Vendor/Staff
 * reaches this "guest/shopper" chrome too. This is a public page — it reads
 * the session but never redirects unauthenticated visitors away.
 */
export function MarketplaceHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream px-4 py-4 sm:px-6 lg:px-10">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-8">
        <Link href="/" className="font-alata text-2xl tracking-tight text-ink">
          VITALINK
        </Link>

        <div className="hidden justify-center lg:flex">
          <SearchBar variant="nav" />
        </div>

        <div className="flex items-center gap-6 justify-self-end">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium tracking-wide text-warm-muted uppercase">Cart</span>
            <CartIcon />
          </div>

          <Suspense fallback={<AccountSlotFallback />}>
            <AccountSlot />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
