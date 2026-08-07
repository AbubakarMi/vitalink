import Image from "next/image";
import Link from "next/link";
import { ViewToggle } from "@/components/marketplace/view-toggle";
import { SortDropdown } from "@/components/marketplace/sort-dropdown";
import type { SortOption } from "@/lib/api/products";

/**
 * Products heading, view toggle, category tabs, sort, and search — Figma
 * EZER-KEY node 1340:444. Category tabs, view toggle, and sort are all real
 * (query params against lib/api/products.ts — design doc §4).
 */
const CATEGORY_TABS: { label: string; slug?: string }[] = [
  { label: "All" },
  { label: "Medical", slug: "medical-equipment" },
  { label: "Scientific", slug: "scientific-tools" },
  { label: "Reagents", slug: "reagents-culture-media" },
  { label: "Laboratory", slug: "lab-equipment" },
];

export function ProductFilters({
  activeCategorySlug,
  activeSearch,
  activeSort,
  activeView,
}: {
  activeCategorySlug?: string;
  activeSearch?: string;
  activeSort?: SortOption;
  activeView: "grid" | "list";
}) {
  return (
    <div className="mx-auto max-w-[1282px] rounded-[10px] bg-white px-10 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-primary">Products</h2>
          <p className="mt-1 text-sm text-text-muted">
            Filter thousands of fully certified SKUs by technical specifications, origin, or availability
          </p>
        </div>
        <ViewToggle activeView={activeView} search={buildSearch({ categorySlug: activeCategorySlug, search: activeSearch, sort: activeSort })} />
      </div>

      <hr className="my-6 border-border" />

      <div className="flex flex-wrap items-center justify-between gap-6">
        <nav className="flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategorySlug === tab.slug;
            return (
              <Link
                key={tab.label}
                href={tab.slug ? `/products?categorySlug=${tab.slug}` : "/products"}
                className={
                  isActive
                    ? "rounded-full bg-[#ecf9f5] px-6 py-2 text-sm text-verified"
                    : "px-3 py-2 text-sm text-text-muted"
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-wrap gap-3">
          <SortDropdown activeSort={activeSort} />

          <form action="/products" className="flex items-center gap-2 rounded-md bg-[#fbfbf9] px-4 py-3 shadow-sm">
            <Image src="/marketplace/search-icon.svg" alt="" width={20} height={20} aria-hidden />
            <input
              type="search"
              name="search"
              defaultValue={activeSearch}
              placeholder="Search by product name"
              className="w-48 bg-transparent text-sm text-text-muted outline-none placeholder:text-[#c1c8c4]"
            />
          </form>
        </div>
      </div>
    </div>
  );
}

function buildSearch(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  return search.toString();
}
