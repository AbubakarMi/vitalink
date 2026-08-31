import { Search } from "lucide-react";

/**
 * Search results banner — shown above the ranked results list
 * (search-results-list.tsx) on both /search (the dedicated results page)
 * and /products?search=… (filtering within the catalog browse). Carries the
 * query and a real result count (no fabricated "results in 0.34 seconds" —
 * see search-results-list.tsx's comment on why this app doesn't literally
 * copy Google's chrome, just its "many ranked results" structure).
 */
export function SearchResultsHeader({ query, resultCount }: { query: string; resultCount: number }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-white px-6 py-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mint text-verified">
        <Search className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold text-ink">
          Results for &ldquo;{query}&rdquo;
        </p>
        <p className="text-sm text-text-muted">
          {resultCount.toLocaleString("en-NG")} {resultCount === 1 ? "product" : "products"} matched your search
        </p>
      </div>
    </div>
  );
}
