import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/** Public nav — Figma EZER-KEY node 1707:7213. */
export function SiteHeader() {
  return (
    <>
      {/* Thin accent line along the very top edge of the viewport. */}
      <div className="h-1 bg-brand-primary" />

      {/* Hairline divider sits above the nav row, not attached to it. */}
      <div className="h-8 border-b border-border bg-[#f7f9fb]" />

      <header className="bg-[#f7f9fb] px-10 py-6">
        <div className="grid grid-cols-3 items-center">
          <Link href="/" className="font-alata text-2xl text-brand-primary">
            VITALINK
          </Link>

          {/* Contained width (not stretched), centered between logo and button. */}
          <form action="/products" className="relative mx-auto w-[291px]">
            <div className="flex h-10 items-center rounded-full bg-[#f4f4f2] pr-10 pl-5">
              <input
                type="search"
                name="search"
                placeholder="Browse Products"
                className="w-full border-b border-verified bg-transparent text-sm text-verified outline-none placeholder:text-verified"
              />
            </div>
            {/* Icon pops slightly outside the bar's top/bottom edges — its own layer, not flush inside. */}
            <button
              type="submit"
              aria-label="Search"
              className="absolute top-1/2 right-0 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-verified"
            >
              <Image src="/marketing/nav-icon.svg" alt="" width={16} height={16} className="invert" aria-hidden />
            </button>
          </form>

          <Link
            href="/register"
            className={buttonVariants({
              className: "ml-auto rounded-md bg-brand-primary px-6 text-white hover:bg-brand-primary-hover",
            })}
          >
            Sign Up
          </Link>
        </div>
      </header>
    </>
  );
}
