import "server-only";
import { z } from "zod";
import { mockProducts } from "./mocks/products";
import { type SortOption } from "./product-sort";

export { SORT_OPTIONS, type SortOption } from "./product-sort";

/** Vendor-facing lifecycle status for a listing — absent on buyer-facing
 * products (a vendor's inventory *is* the marketplace catalog, scoped to
 * their own vendorId, with these extra management fields buyer views never
 * read or send). See docs/superpowers/specs/2026-08-12-vendor-dashboard-round1-design.md §2. */
export const VENDOR_PRODUCT_STATUSES = ["Active", "PendingReview", "OutOfStock", "Archived", "Rejected"] as const;
export type VendorProductStatus = (typeof VENDOR_PRODUCT_STATUSES)[number];

const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  categorySlug: z.string(),
  price: z.number(),
  currency: z.string(),
  /** Primary image — always mirrors the `isPrimary: true` entry in `images`
   * when that's populated, kept as its own field since every existing card/
   * cart/checkout view reads just this one image. */
  imageUrl: z.string().nullable(),
  /** Full gallery — optional since only vendor-uploaded products (via the
   * New Product wizard) populate more than one image; seeded catalog
   * products only ever set imageUrl. */
  images: z.array(z.object({ url: z.string(), isPrimary: z.boolean() })).optional(),
  shortDescription: z.string(),
  inStock: z.boolean(),
  badge: z.enum(["NAFDAC Approved", "FDA Approved"]).nullable().optional(),
  freeDelivery: z.boolean().optional(),
  // Marketplace grid card fields (Figma EZER-KEY node 1340:439) — optional
  // since the landing page's compact ProductCard doesn't use them.
  brand: z.string().optional(),
  brandSku: z.string().optional(),
  /** Exact category text shown on the card — the design's card copy ("Medical
   * Equipment", "Scientific Equipment") doesn't always match the nav category
   * names ("Medical Equipment", "Scientific Tools"); falls back to the
   * category's own name via lib/api/categories.ts when absent. */
  categoryLabel: z.string().optional(),
  originalPrice: z.number().optional(),
  /** Signed trend indicator shown as a colored badge (+4 green, -10 red) —
   * source unclear (price change? demand?), rendered as-is without claiming
   * a specific meaning. */
  trendPercent: z.number().optional(),
  stockCount: z.number().optional(),
  // Product detail page fields (Figma EZER-KEY node 1591:3576).
  manufacturedIn: z.string().optional(),
  technicalSpecs: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  includedAccessories: z.array(z.string()).optional(),
  clinicalUseCases: z.array(z.string()).optional(),
  // Vendor dashboard fields (round 1) — optional, buyer-facing code paths
  // never set or read these.
  vendorId: z.string().optional(),
  status: z.enum(VENDOR_PRODUCT_STATUSES).optional(),
  /** Internal Vitalink SKU (e.g. "VIT-CON0001") — distinct from brandSku,
   * which is the manufacturer's own model number. */
  sku: z.string().optional(),
  promoPrice: z.number().optional(),
  lowStockThreshold: z.number().optional(),
  /** Numbered how-to-use steps shown in the New Product wizard's verification
   * step and on a draft product's detail view — distinct from technicalSpecs/
   * includedAccessories/clinicalUseCases, which are the published-page tabs. */
  usageTutorial: z.array(z.object({ title: z.string(), body: z.string() })).optional(),
  /** Set when an admin rejects this product (lib/api/admin/products.ts's
   * rejectAdminProduct) so the vendor sees why on their own product detail
   * page (components/vendor/product-detail-view.tsx) and can fix it before
   * resubmitting. */
  rejectionReason: z.string().nullable().optional(),
});
export type Product = z.infer<typeof ProductSchema>;
export { ProductSchema };

/**
 * Always mock. The real catalog is Product + Offer as two related entities
 * (one product, many vendor offers at different price/stock/condition), not
 * this flat Product shape — see lib/api/marketplace.ts (gated by the same
 * PRODUCTS_DATA_SOURCE flag) for the real, live adapter used by the
 * marketplace listing/detail/cart pages. This module stays mock-only for the
 * pages not yet migrated (homepage feed, vendor's own listing, mock-mode
 * similar-products) so flipping PRODUCTS_DATA_SOURCE=live doesn't also try
 * to run these functions' old, never-finished live branches (they read
 * cookies() for credential-forwarding inside a "use cache" scope, which
 * Next's Cache Components disallows — confirmed 2026-09-02 when this crashed
 * the homepage on first live test).
 */
export interface ListProductsParams {
  categorySlug?: string;
  search?: string;
  sort?: SortOption;
  /** Comma-separated brand names (matches ProductFilters' Brand dropdown, a
   * single query param so it round-trips through Pagination/ViewToggle's
   * plain string searchParams without special-casing an array param). */
  brand?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  [key: string]: string | number | boolean | undefined;
}

export async function listProducts(params: ListProductsParams = {}): Promise<Product[]> {
  "use cache";
  return z.array(ProductSchema).parse(filterMockProducts(params));
}

export interface PagedProducts {
  items: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Real pagination — now that the mock catalog has ~100 products, "Showing
 * X of Y" and page controls reflect actual slices, not the design's
 * fabricated "100 of 22,500" (design doc §1's no-fabrication principle). */
export async function listProductsPaged(
  params: ListProductsParams & { page?: number; pageSize?: number } = {},
): Promise<PagedProducts> {
  "use cache";
  const all = await listProducts(params);
  const pageSize = params.pageSize ?? 12;
  const page = Math.max(1, params.page ?? 1);
  const totalCount = all.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const start = (page - 1) * pageSize;
  return { items: all.slice(start, start + pageSize), totalCount, page, pageSize, totalPages };
}

/** Catalog-wide price bounds — sets the min/max on the sidebar's Price range
 * slider (components/marketplace/price-filter.tsx). Ignores any active
 * filters so the slider's own range never shrinks based on itself. */
export async function getPriceBounds(): Promise<{ min: number; max: number }> {
  "use cache";
  const prices = mockProducts.map((product) => product.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Bulk lookup for rendering a fixed set of ids (Intent Search recommendation
 * cards, cart line items) — preserves the input order, silently drops ids
 * that no longer resolve rather than throwing. */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  "use cache";
  if (ids.length === 0) return [];
  const all = await listProducts();
  const byId = new Map(all.map((product) => [product.id, product]));
  return ids.map((id) => byId.get(id)).filter((product): product is Product => Boolean(product));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  const found = mockProducts.find((product) => product.slug === slug);
  return found ? ProductSchema.parse(found) : null;
}

/**
 * Relevance score for a search term against one product — higher is a
 * better match. Mirrors, at a small scale, how a real search engine ranks
 * results (exact match beats prefix match beats "appears somewhere," and a
 * hit in the title counts more than a hit buried in the description) so
 * search results can be shown best-match-first like Google's, instead of in
 * whatever order the mock catalog array happens to be in. Returns 0 (no
 * match at all) for a product that shouldn't be included.
 */
function searchRelevance(product: Product, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const name = product.name.toLowerCase();
  const brand = (product.brand ?? "").toLowerCase();
  const category = (product.categoryLabel ?? product.categorySlug).toLowerCase();
  const description = product.shortDescription.toLowerCase();

  if (name === q) return 100;
  if (name.startsWith(q)) return 90;
  if (name.includes(q)) return 70;
  if (brand.includes(q) || brand.split(/\s+/).some((word) => word === q)) return 50;
  if (category.includes(q)) return 40;
  if (description.includes(q)) return 20;
  return 0;
}

function filterMockProducts(params: ListProductsParams) {
  const wantedBrands = params.brand
    ? String(params.brand).split(",").map((b) => b.trim()).filter(Boolean)
    : [];
  const minPrice = params.minPrice !== undefined && params.minPrice !== "" ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice !== undefined && params.maxPrice !== "" ? Number(params.maxPrice) : undefined;
  const query = params.search?.trim();

  const filtered = mockProducts.filter((product) => {
    if (params.categorySlug && product.categorySlug !== params.categorySlug) return false;
    if (query && searchRelevance(product, query) === 0) return false;
    if (wantedBrands.length > 0 && !wantedBrands.includes(product.brand ?? "")) return false;
    if (minPrice !== undefined && product.price < minPrice) return false;
    if (maxPrice !== undefined && product.price > maxPrice) return false;
    return true;
  });

  switch (params.sort) {
    case "price-asc":
      return [...filtered].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...filtered].sort((a, b) => b.price - a.price);
    case "name-asc":
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    default:
      // Best-match-first when searching (Google-style ranking); otherwise
      // the catalog's own order.
      return query ? [...filtered].sort((a, b) => searchRelevance(b, query) - searchRelevance(a, query)) : filtered;
  }
}
