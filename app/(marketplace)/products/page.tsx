import { MarketplacePageHeader } from "@/components/marketplace/marketplace-page-header";
import { ProductFilters } from "@/components/marketplace/product-filters";
import { MarketplaceProductCard } from "@/components/marketplace/product-card";
import { Pagination } from "@/components/marketplace/pagination";
import { ExploreCategories } from "@/components/marketplace/explore-categories";
import { listProductsPaged, type SortOption } from "@/lib/api/products";

interface PageProps {
  searchParams: Promise<{
    categorySlug?: string;
    search?: string;
    sort?: SortOption;
    view?: "list";
    page?: string;
  }>;
}

// Reads searchParams directly — genuinely per-request dynamic (category/search
// filtering), not prerenderable, same pattern as the cookie-dependent pages.
export const instant = false;

/**
 * Marketplace product listing — originally built to pixel-fidelity against
 * Figma EZER-KEY node 1340:439; restyled in the instrument-panel brand
 * refresh (see components/marketing/vitals-waveform.tsx). Reads the
 * categorySlug/search/sort/view params the footer links, hero search form,
 * and filter bar submit here (design doc §4). Mocked products (design doc §1).
 *
 * List view reuses the same card in a single column rather than a separate
 * horizontal list-item design — a real layout difference, not a fake toggle,
 * but a simplification given the scope here.
 */
export default async function MarketplacePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { items: products, totalCount, pageSize, totalPages } = await listProductsPaged({
    ...params,
    page,
  });
  const view: "grid" | "list" = params.view === "list" ? "list" : "grid";

  return (
    <main className="space-y-6">
      <MarketplacePageHeader resultCount={totalCount} />

      <ProductFilters
        activeCategorySlug={params.categorySlug}
        activeSearch={params.search}
        activeSort={params.sort}
        activeView={view}
      />

      <div className="mx-auto max-w-6xl px-0">
        {products.length > 0 ? (
          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                : "grid grid-cols-1 gap-4"
            }
          >
            {products.map((product) => (
              <MarketplaceProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="rounded-[10px] border border-line bg-white px-10 py-12 text-center text-text-muted">
            No products match that search yet.
          </p>
        )}
      </div>

      <Pagination page={page} pageSize={pageSize} totalCount={totalCount} totalPages={totalPages} searchParams={params} />

      <ExploreCategories activeCategorySlug={params.categorySlug} />
    </main>
  );
}
