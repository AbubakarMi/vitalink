import { Suspense } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/marketing/search-bar";
import { AccountSlot, AccountSlotFallback } from "@/components/marketing/account-slot";

/**
 * Public nav — restyled to match the client's Ezerhealthcare/HealthBank EHR
 * reference: a light cream bar, dark-green wordmark and CTA, moderate
 * (not full-pill) radius. The hero directly below stays the dark
 * ECG-trace hero as-is — this is a deliberate light-nav-over-dark-hero
 * junction, not a mismatch.
 *
 * The account slot (Login/Sign Up vs. the real account menu) is
 * components/marketing/account-slot.tsx, shared with MarketplaceHeader —
 * this used to hardcode Login/Sign Up unconditionally, so a signed-in
 * customer, vendor, or admin browsing the public homepage saw guest-only nav
 * even though they were already authenticated. Wrapped in its own Suspense
 * boundary (not making this whole header async) so the rest of the
 * homepage keeps its static shell under Cache Components/PPR — only the
 * account slot's cookies() read is dynamic.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream px-4 py-4 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link href="/" className="shrink-0 font-alata text-xl tracking-tight text-ink sm:text-2xl">
          VITALINK
        </Link>

        <div className="hidden justify-center lg:flex">
          <SearchBar variant="nav" />
        </div>

        <div className="flex items-center gap-3 sm:gap-6 justify-self-end">
          <Suspense fallback={<AccountSlotFallback withSignUp />}>
            <AccountSlot withSignUp />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
