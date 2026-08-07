import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/** Public nav — landing-page redesign. Ink chrome so the header reads as one
 * continuous instrument-panel band with the hero below it, rather than a
 * light bar sitting on top of a dark section. */
export function SiteHeader() {
  return (
    <>
      {/* "Live" signal hairline — the one line of --color-signal outside the
       * waveform itself, echoing the same idea at the very top edge. */}
      <div className="h-[3px] bg-signal" />

      <header className="border-b border-white/10 bg-ink px-10 py-5">
        <div className="mx-auto flex max-w-6xl items-center gap-8">
          <Link href="/" className="font-alata text-2xl tracking-tight text-white">
            VITALINK
          </Link>

          <form action="/products" className="relative ml-auto hidden shrink-0 sm:block">
            <div className="group flex h-11 w-64 items-center gap-3 rounded-full border border-white/20 bg-white/[0.07] pr-1.5 pl-5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-within:w-[26rem] focus-within:border-signal/70 focus-within:bg-white/[0.1] focus-within:shadow-[0_0_0_4px_rgba(142,161,164,0.2)]">
              <Image src="/marketing/search-icon.svg" alt="" width={15} height={15} className="shrink-0 opacity-50 invert" aria-hidden />
              <input
                type="search"
                name="search"
                placeholder="Search the catalog…"
                className="w-full bg-transparent font-mono text-[13px] text-white/90 outline-none placeholder:text-white/35"
              />
              <button
                type="submit"
                aria-label="Search"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-signal text-ink transition-colors group-focus-within:bg-white"
              >
                <Image src="/marketing/nav-icon.svg" alt="" width={13} height={13} aria-hidden />
              </button>
            </div>
          </form>

          <Link
            href="/register"
            className={buttonVariants({
              className: "rounded-md bg-white px-6 font-semibold !text-[#002708] shadow-sm hover:bg-white/85",
            })}
          >
            Sign Up
          </Link>
        </div>
      </header>
    </>
  );
}
