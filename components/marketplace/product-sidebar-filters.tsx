import type { SortOption } from "@/lib/api/products";
import { CategoryFilter } from "@/components/marketplace/category-filter";
import { BrandFilter } from "@/components/marketplace/brand-filter";
import { PriceFilter } from "@/components/marketplace/price-filter";

/** Left-hand filter panel — Category, Price, Brand stacked in one card,
 * matching the reference product-listing screenshot's left sidebar layout. */
export function ProductSidebarFilters({
  activeCategorySlug,
  activeSearch,
  activeSort,
  brands,
  activeBrands,
  priceBounds,
  activeMinPrice,
  activeMaxPrice,
}: {
  activeCategorySlug?: string;
  activeSearch?: string;
  activeSort?: SortOption;
  brands: string[];
  activeBrands: string[];
  priceBounds: { min: number; max: number };
  activeMinPrice?: string;
  activeMaxPrice?: string;
}) {
  const search = buildSearch({
    categorySlug: activeCategorySlug,
    search: activeSearch,
    sort: activeSort,
    brand: activeBrands.length > 0 ? activeBrands.join(",") : undefined,
    minPrice: activeMinPrice,
    maxPrice: activeMaxPrice,
  });

  return (
    <aside className="w-full shrink-0 space-y-6 self-start rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-64 lg:overflow-y-auto">
      <CategoryFilter activeCategorySlug={activeCategorySlug} search={search} />
      <hr className="border-line" />
      <PriceFilter
        key={`${activeMinPrice ?? ""}-${activeMaxPrice ?? ""}`}
        bounds={priceBounds}
        activeMinPrice={activeMinPrice}
        activeMaxPrice={activeMaxPrice}
      />
      <hr className="border-line" />
      <BrandFilter key={activeBrands.join(",")} brands={brands} activeBrands={activeBrands} />
    </aside>
  );
}

function buildSearch(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  return search.toString();
}
