import { MarketplacePageHeader } from "@/components/marketplace/marketplace-page-header";
import { SearchResultsHeader } from "@/components/marketplace/search-results-header";
import { SearchResultsList } from "@/components/marketplace/search-results-list";
import { ProductSidebarFilters } from "@/components/marketplace/product-sidebar-filters";
import { ProductToolbar } from "@/components/marketplace/product-toolbar";
import { MarketplaceProductCard } from "@/components/marketplace/product-card";
import { Pagination } from "@/components/marketplace/pagination";
import { listProductsPaged, getPriceBounds, type SortOption } from "@/lib/api/products";
import { listBrands } from "@/lib/api/brands";

interface PageProps {
  searchParams: Promise<{
    categorySlug?: string;
    search?: string;
    sort?: SortOption;
    view?: "list";
    page?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

// Reads searchParams directly — genuinely per-request dynamic (category/search
// filtering), not prerenderable, same pattern as the cookie-dependent pages.
export const instant = false;

/**
 * Marketplace product listing — originally built to pixel-fidelity against
 * Figma EZER-KEY node 1340:439; restyled in the instrument-panel brand
 * refresh (see components/marketing/vitals-waveform.tsx). Reads the
 * categorySlug/search/sort/view/brand/minPrice/maxPrice params the footer
 * links, hero search form, and sidebar filters submit here (design doc §4).
 * Mocked products (design doc §1).
 *
 * List view reuses the same card in a single column rather than a separate
 * horizontal list-item design — a real layout difference, not a fake toggle,
 * but a simplification given the scope here.
 */
export default async function MarketplacePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const activeBrands = params.brand ? params.brand.split(",").filter(Boolean) : [];
  const [{ items: products, totalCount, pageSize, totalPages }, brands, priceBounds] = await Promise.all([
    listProductsPaged({ ...params, page }),
    listBrands(),
    getPriceBounds(),
  ]);
  const view: "grid" | "list" = params.view === "list" ? "list" : "grid";
  const query = params.search?.trim();
  const toolbarSearch = buildSearch({
    categorySlug: params.categorySlug,
    search: params.search,
    sort: params.sort,
    brand: activeBrands.length > 0 ? activeBrands.join(",") : undefined,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
  });

  return (
    <main className="space-y-6">
      {query ? (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-0">
          <SearchResultsHeader query={query} resultCount={totalCount} />
        </div>
      ) : (
        <MarketplacePageHeader resultCount={totalCount} />
      )}

      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 lg:flex-row">
        <ProductSidebarFilters
          activeCategorySlug={params.categorySlug}
          activeSearch={params.search}
          activeSort={params.sort}
          brands={brands}
          activeBrands={activeBrands}
          priceBounds={priceBounds}
          activeMinPrice={params.minPrice}
          activeMaxPrice={params.maxPrice}
        />

        <div className="w-full min-w-0 flex-1 space-y-6">
          <ProductToolbar activeSearch={params.search} activeSort={params.sort} activeView={view} search={toolbarSearch} />

          {products.length > 0 ? (
            query ? (
              <SearchResultsList products={products} query={query} />
            ) : (
              <div
                className={
                  view === "grid"
                    ? "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid grid-cols-1 gap-4"
                }
              >
                {products.map((product) => (
                  <MarketplaceProductCard key={product.id} product={product} />
                ))}
              </div>
            )
          ) : (
            <p className="rounded-[10px] border border-line bg-white px-10 py-12 text-center text-text-muted">
              No products match that search yet.
            </p>
          )}

          <Pagination page={page} pageSize={pageSize} totalCount={totalCount} totalPages={totalPages} searchParams={params} />
        </div>
      </div>
    </main>
  );
}

function buildSearch(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  return search.toString();
}
