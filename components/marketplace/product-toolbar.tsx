import { Search } from "lucide-react";
import { ViewToggle } from "@/components/marketplace/view-toggle";
import { SortDropdown } from "@/components/marketplace/sort-dropdown";
import type { SortOption } from "@/lib/api/products";

/** Top bar above the product grid: result heading, view toggle, sort, and
 * search. Category/Brand/Price live in ProductSidebarFilters to the left. */
export function ProductToolbar({
  activeSearch,
  activeSort,
  activeView,
  search,
}: {
  activeSearch?: string;
  activeSort?: SortOption;
  activeView: "grid" | "list";
  search: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white px-6 py-5">
      <ViewToggle activeView={activeView} search={search} />

      <div className="flex flex-wrap gap-3">
        <SortDropdown activeSort={activeSort} />

        <form action="/products" className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-3">
          {preservedParams(search).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <Search className="size-[18px] text-ink-soft" aria-hidden />
          <input
            type="search"
            name="search"
            defaultValue={activeSearch}
            placeholder="Search by product name"
            className="w-48 bg-transparent text-sm text-ink-soft outline-none placeholder:text-text-muted"
          />
        </form>
      </div>
    </div>
  );
}

/** Carries category/brand/price/sort along with a new search term — a plain
 * GET form only submits its own named fields, so without these the search
 * box would silently drop whatever else was filtered. */
function preservedParams(search: string): [string, string][] {
  const params = new URLSearchParams(search);
  params.delete("search");
  params.delete("page");
  return Array.from(params.entries());
}
