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

          <form action="/products" className="relative ml-auto hidden w-72 sm:block">
            <div className="flex h-10 items-center rounded-md border border-white/15 bg-white/5 pr-10 pl-4">
              <input
                type="search"
                name="search"
                placeholder="Search the catalog…"
                className="w-full bg-transparent font-mono text-[13px] text-white/90 outline-none placeholder:text-white/40"
              />
            </div>
            <button
              type="submit"
              aria-label="Search"
              className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded text-white/50 hover:text-signal"
            >
              <Image src="/marketing/nav-icon.svg" alt="" width={14} height={14} className="invert" aria-hidden />
            </button>
          </form>

          <Link
            href="/register"
            className={buttonVariants({
              className: "rounded-md bg-signal px-6 font-medium text-ink hover:bg-signal/85",
            })}
          >
            Sign Up
          </Link>
        </div>
      </header>
    </>
  );
}
