import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SearchBar } from "@/components/marketing/search-bar";

/**
 * Public nav — restyled to match the client's Ezerhealthcare/HealthBank EHR
 * reference: a light cream bar, dark-green wordmark and CTA, moderate
 * (not full-pill) radius. The hero directly below stays the dark
 * ECG-trace hero as-is — this is a deliberate light-nav-over-dark-hero
 * junction, not a mismatch.
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
          <Link href="/login" className="text-sm whitespace-nowrap text-ink-soft hover:text-ink">
            Login
          </Link>

          <Link
            href="/register"
            className={buttonVariants({
              className: "rounded-lg bg-ink px-4 font-medium whitespace-nowrap !text-white hover:bg-ink/85 sm:px-6",
            })}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
