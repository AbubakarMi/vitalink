import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/**
 * Public nav — restyled to match the client's Ezerhealthcare/HealthBank EHR
 * reference: a light cream bar, dark-green wordmark and CTA, moderate
 * (not full-pill) radius. The hero directly below stays the dark
 * ECG-trace hero as-is — this is a deliberate light-nav-over-dark-hero
 * junction, not a mismatch.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-line bg-cream px-10 py-4">
      <div className="mx-auto flex max-w-6xl items-center gap-8">
        <Link href="/" className="font-alata text-2xl tracking-tight text-ink">
          VITALINK
        </Link>

        <form action="/products" className="relative ml-auto hidden shrink-0 sm:block">
          <div className="group flex h-11 w-64 items-center gap-3 rounded-lg border border-line bg-white pr-1.5 pl-4 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-within:w-[26rem] focus-within:border-ink/40 focus-within:shadow-[0_0_0_3px_rgba(0,39,8,0.06)]">
            <Image src="/marketing/search-icon.svg" alt="" width={15} height={15} className="shrink-0 opacity-50" aria-hidden />
            <input
              type="search"
              name="search"
              placeholder="Search the catalog…"
              className="w-full bg-transparent text-[13px] text-ink-soft outline-none placeholder:text-warm-muted"
            />
            <button
              type="submit"
              aria-label="Search"
              className="flex size-8 shrink-0 items-center justify-center rounded-md bg-mint text-ink transition-colors group-focus-within:bg-ink group-focus-within:text-white"
            >
              <Image src="/marketing/nav-icon.svg" alt="" width={13} height={13} aria-hidden />
            </button>
          </div>
        </form>

        <Link href="/login" className="hidden text-sm text-ink-soft hover:text-ink sm:block">
          Login
        </Link>

        <Link
          href="/register"
          className={buttonVariants({
            className: "rounded-lg bg-ink px-6 font-medium !text-white hover:bg-ink/85",
          })}
        >
          Sign Up
        </Link>
      </div>
    </header>
  );
}
