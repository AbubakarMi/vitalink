import Link from "next/link";
import { Search } from "lucide-react";
import { SearchResultsHeader } from "@/components/marketplace/search-results-header";
import { SearchResultsList } from "@/components/marketplace/search-results-list";
import { Pagination } from "@/components/marketplace/pagination";
import { listProductsPaged } from "@/lib/api/products";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

// Reads searchParams directly — genuinely per-request dynamic, not prerenderable.
export const instant = false;

/**
 * Dedicated search results page — what SearchBar's catalog-mode submit
 * (search-bar.tsx) actually sends someone to, separate from /products'
 * filtered catalog browse. Google-style: a plain ranked list of everything
 * that matched (searchRelevance in lib/api/products.ts), not a curated
 * "here's one result" answer — click through to see any one of them.
 */
export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  if (!query) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <Search className="mx-auto size-8 text-text-muted" aria-hidden />
        <p className="mt-4 text-sm text-text-muted">Search the catalog using the search bar above.</p>
      </main>
    );
  }

  const { items: products, totalCount, pageSize, totalPages } = await listProductsPaged({ search: query, page });

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 sm:px-6">
      <SearchResultsHeader query={query} resultCount={totalCount} />

      {products.length > 0 ? (
        <>
          <div className="flex justify-end">
            <Link
              href={`/products?search=${encodeURIComponent(query)}`}
              className="text-xs font-medium text-verified hover:underline"
            >
              Refine with filters, sort &amp; price range →
            </Link>
          </div>
          <SearchResultsList products={products} query={query} />
          <Pagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            searchParams={{ q: query }}
            basePath="/search"
          />
        </>
      ) : (
        <div className="rounded-2xl border border-line bg-white px-10 py-14 text-center">
          <Search className="mx-auto size-8 text-text-muted" aria-hidden />
          <p className="mt-4 text-text-muted">
            No results found for <span className="font-medium text-ink">&ldquo;{query}&rdquo;</span>.
          </p>
          <p className="mt-1 text-sm text-text-muted">Try a different or shorter search term.</p>
          <Link
            href="/products"
            className="mt-4 inline-block rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink/85"
          >
            Browse the full catalog
          </Link>
        </div>
      )}
    </main>
  );
}
