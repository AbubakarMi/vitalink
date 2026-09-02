import Link from "next/link";
import { MarketplacePageHeader } from "@/components/marketplace/marketplace-page-header";
import { SearchResultsHeader } from "@/components/marketplace/search-results-header";
import { SearchResultsList } from "@/components/marketplace/search-results-list";
import { ProductSidebarFilters } from "@/components/marketplace/product-sidebar-filters";
import { ProductToolbar } from "@/components/marketplace/product-toolbar";
import { MarketplaceProductCard } from "@/components/marketplace/product-card";
import { Pagination } from "@/components/marketplace/pagination";
import { listProductsPaged, getPriceBounds, type SortOption } from "@/lib/api/products";
import { listBrands } from "@/lib/api/brands";
import {
  listMarketplaceProducts,
  listMarketplaceCategories,
  listMarketplaceBrands,
  MARKETPLACE_LIVE,
  MARKETPLACE_SORT_OPTIONS,
  type MarketplaceSort,
} from "@/lib/api/marketplace";
import { LiveProductCard } from "@/components/marketplace/live-product-card";

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
    // Live-mode-only params — real category/brand filters are ids, not
    // slugs/names, and the real sort vocabulary differs from SortOption
    // (see lib/api/marketplace.ts's MARKETPLACE_SORT_OPTIONS).
    categoryId?: string;
    brandId?: string;
    liveSort?: MarketplaceSort;
  }>;
}

// Reads searchParams directly — genuinely per-request dynamic (category/search
// filtering), not prerenderable, same pattern as the cookie-dependent pages.
export const instant = false;

/**
 * Marketplace product listing — originally built to pixel-fidelity against
 * Figma EZER-KEY node 1340:439; restyled in the instrument-panel brand
 * refresh (see components/marketing/vitals-waveform.tsx). Mocked products by
 * default (design doc §1); renders LiveMarketplaceListing below instead once
 * PRODUCTS_DATA_SOURCE=live — a genuinely different shape (Product+Offer,
 * real category/brand ids, a different sort vocabulary), not a reskin of
 * this mock tree.
 */
export default async function MarketplacePage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (MARKETPLACE_LIVE) {
    return <LiveMarketplaceListing params={params} />;
  }

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

const SORT_LABEL: Record<MarketplaceSort, string> = {
  relevance: "Most relevant",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  rating: "Top rated",
  newest: "Newest",
  name: "Name (A–Z)",
};

interface LiveParams {
  search?: string;
  page?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: string;
  maxPrice?: string;
  liveSort?: MarketplaceSort;
}

/** The real catalog's listing — simpler filter bar than the mock's sidebar
 * (real category/brand filters are ids, resolved from
 * listMarketplaceCategories/listMarketplaceBrands, not slugs/names), Buy-Box-
 * style cards ("From ₦X · N offers" — see live-product-card.tsx). */
async function LiveMarketplaceListing({ params }: { params: LiveParams }) {
  const page = Math.max(1, Number(params.page) || 1);
  const sort = params.liveSort && MARKETPLACE_SORT_OPTIONS.includes(params.liveSort) ? params.liveSort : "relevance";

  const [{ data: products, totalCount, pageSize, totalPages }, categories, brands] = await Promise.all([
    listMarketplaceProducts({
      page,
      pageSize: 12,
      search: params.search,
      categoryId: params.categoryId,
      brandId: params.brandId,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      sort,
    }),
    listMarketplaceCategories(),
    listMarketplaceBrands(),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-0">
      <div>
        <p className="font-mono text-xs tracking-[0.2em] text-verified uppercase">Marketplace</p>
        <h1 className="mt-1 font-[family-name:var(--font-newsreader)] text-3xl text-ink">
          {totalCount.toLocaleString("en-NG")} product{totalCount === 1 ? "" : "s"}
        </h1>
      </div>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <aside className="w-full shrink-0 space-y-6 lg:w-64">
          <form method="get" className="space-y-5 rounded-2xl border border-line bg-white p-4">
            {params.search && <input type="hidden" name="search" value={params.search} />}
            <div>
              <label htmlFor="categoryId" className="text-xs font-medium text-ink-soft">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={params.categoryId ?? ""}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.productCount})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="brandId" className="text-xs font-medium text-ink-soft">
                Brand
              </label>
              <select
                id="brandId"
                name="brandId"
                defaultValue={params.brandId ?? ""}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
              >
                <option value="">All brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.productCount})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-xs font-medium text-ink-soft">Price range (N)</p>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  name="minPrice"
                  min="0"
                  defaultValue={params.minPrice}
                  placeholder="Min"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                />
                <span className="text-text-muted">–</span>
                <input
                  type="number"
                  name="maxPrice"
                  min="0"
                  defaultValue={params.maxPrice}
                  placeholder="Max"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                />
              </div>
            </div>

            <button type="submit" className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink/85">
              Apply filters
            </button>
            {(params.categoryId || params.brandId || params.minPrice || params.maxPrice) && (
              <Link href="/products" className="block text-center text-xs font-medium text-verified hover:underline">
                Clear filters
              </Link>
            )}
          </form>
        </aside>

        <div className="w-full min-w-0 flex-1 space-y-6">
          <form method="get" className="flex items-center justify-end gap-2">
            {params.search && <input type="hidden" name="search" value={params.search} />}
            {params.categoryId && <input type="hidden" name="categoryId" value={params.categoryId} />}
            {params.brandId && <input type="hidden" name="brandId" value={params.brandId} />}
            {params.minPrice && <input type="hidden" name="minPrice" value={params.minPrice} />}
            {params.maxPrice && <input type="hidden" name="maxPrice" value={params.maxPrice} />}
            <label htmlFor="liveSort" className="text-xs font-medium text-text-muted">
              Sort
            </label>
            <select
              id="liveSort"
              name="liveSort"
              defaultValue={sort}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
            >
              {MARKETPLACE_SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {SORT_LABEL[option]}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:border-ink/40">
              Go
            </button>
          </form>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <LiveProductCard key={product.productId} product={product} />
              ))}
            </div>
          ) : (
            <p className="rounded-[10px] border border-line bg-white px-10 py-12 text-center text-text-muted">
              No products match that search yet.
            </p>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
                const query = new URLSearchParams();
                if (params.search) query.set("search", params.search);
                if (params.categoryId) query.set("categoryId", params.categoryId);
                if (params.brandId) query.set("brandId", params.brandId);
                if (params.minPrice) query.set("minPrice", params.minPrice);
                if (params.maxPrice) query.set("maxPrice", params.maxPrice);
                if (sort !== "relevance") query.set("liveSort", sort);
                if (n > 1) query.set("page", String(n));
                const href = query.toString() ? `/products?${query.toString()}` : "/products";
                return (
                  <Link
                    key={n}
                    href={href}
                    className={
                      n === page
                        ? "flex size-8 items-center justify-center rounded-lg bg-ink text-xs font-medium text-white"
                        : "flex size-8 items-center justify-center rounded-lg text-xs font-medium text-ink-soft hover:bg-mint/60"
                    }
                  >
                    {n}
                  </Link>
                );
              })}
              <span className="ml-2 text-xs text-text-muted">
                {pageSize * (page - 1) + 1}–{Math.min(pageSize * page, totalCount)} of {totalCount.toLocaleString("en-NG")}
              </span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
