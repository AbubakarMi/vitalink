import { Jumbotron } from "@/components/marketplace/jumbotron";
import { ProductFilters } from "@/components/marketplace/product-filters";
import { MarketplaceProductCard } from "@/components/marketplace/product-card";
import { Pagination } from "@/components/marketplace/pagination";
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
 * Marketplace product listing — Figma EZER-KEY node 1340:439. Reads the
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
      <Jumbotron>Marketplace</Jumbotron>

      <ProductFilters
        activeCategorySlug={params.categorySlug}
        activeSearch={params.search}
        activeSort={params.sort}
        activeView={view}
      />

      <div className="mx-auto max-w-[1282px] px-0">
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
          <p className="rounded-[10px] bg-white px-10 py-12 text-center text-text-muted">
            No products match that search yet.
          </p>
        )}
      </div>

      <Pagination page={page} pageSize={pageSize} totalCount={totalCount} totalPages={totalPages} searchParams={params} />

      <Jumbotron>Recently Viewed / Recommended</Jumbotron>
    </main>
  );
}
