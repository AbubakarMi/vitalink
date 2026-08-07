import Image from "next/image";
import { Button } from "@/components/ui/button";

/**
 * Search hero — Figma EZER-KEY node 1707:7213 / "Guest Screen.pdf" export,
 * adapted for anonymous visitors per project decision (design showed a
 * personalized "Good Morning Mr. Sam" greeting with per-user recent-activity
 * content; this is the public landing page, so that becomes generic copy,
 * not a specific user's name).
 *
 * The callout panel is a single flat color, not the source file's two
 * overlapping near-identical rectangles (#f4f7fa/#f2f6f9, 2 RGB units
 * apart) — that reads as a hard visible seam/second card once rendered as
 * solid CSS boxes, not the design's intent. See the panel's inline comment.
 *
 * The "Search by intent/budget/specification" pills describe the design's
 * AI-powered search concept (PRD's Intelligent Search / AI Health Assistant),
 * which is explicitly out of scope for this build. Rendered for copy
 * fidelity as descriptive marketing content, but nothing here is wired to
 * real intent/budget/specification filtering — the search box itself does a
 * plain text search against the product catalog.
 */
export function HeroSearch() {
  return (
    <section className="px-10 pt-4">
      {/*
        One flat panel, no seam. Figma's source has two overlapping
        rectangles here (#f4f7fa outer / #f2f6f9 inner) only 2 RGB units
        apart — almost certainly leftover from how the designer built the
        layer, not something meant to be visible. Rendered as a hard-edged
        CSS box it read as a second, darker card stacked on top — not the
        subtle, barely-there step the source values would suggest. One
        color, sized to the actual content instead of the source's ~495px
        (mostly empty space).
      */}
      <div className="mx-auto max-w-4xl rounded-[10px] bg-[#f4f7fa] px-8 py-10 sm:px-14 sm:py-12">
        <div className="ml-auto max-w-md">
          <h2 className="font-[family-name:var(--font-newsreader)] text-2xl capitalize text-black sm:text-3xl">
            Intelligent Intent-Based Search
          </h2>
          <p className="mt-2 text-sm text-black">
            Search reads what a person is actually trying to solve, not just the words they type, and surfaces the
            products and guidance that match the underlying goal.
          </p>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-6 max-w-5xl rounded-[10px] bg-surface px-8 py-12 shadow-[0px_10px_15px_rgba(0,0,0,0.1)] sm:px-14">
        <Image src="/marketing/menu-icon.svg" alt="" width={12} height={12} aria-hidden />

        <h1 className="mt-6 text-3xl text-black sm:text-4xl lg:text-5xl lg:whitespace-nowrap">Welcome to Vitalink</h1>
        <p className="mt-2 text-3xl text-black sm:text-4xl lg:text-5xl lg:whitespace-nowrap">
          How can we support your practice today?
        </p>

        <form action="/products" className="mt-8 flex flex-col gap-4">
          <div className="flex items-center gap-4 rounded-[10px] border border-border bg-surface px-4 py-3">
            <Image src="/marketing/search-icon.svg" alt="" width={24} height={24} aria-hidden />
            <input
              type="search"
              name="search"
              placeholder="e.g. What type of kits will I use to test for malaria?"
              className="flex-1 bg-transparent text-sm text-text-muted outline-none placeholder:text-text-muted"
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-[10px] bg-brand-primary hover:bg-brand-primary-hover"
              aria-label="Search"
            >
              <Image src="/marketing/search-submit-icon.svg" alt="" width={19} height={16} aria-hidden />
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            {["Search by intent", "Search by budget", "Search by specification"].map((label) => (
              <span
                key={label}
                className="rounded-[10px] border border-black/10 bg-surface px-4 py-2 text-sm text-brand-primary"
              >
                {label}
              </span>
            ))}
          </div>
        </form>
      </div>
    </section>
  );
}
