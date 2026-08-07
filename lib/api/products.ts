import "server-only";
import { z } from "zod";
import { apiClient } from "./client";
import { mockProducts } from "./mocks/products";
import { type SortOption } from "./product-sort";

export { SORT_OPTIONS, type SortOption } from "./product-sort";

const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  categorySlug: z.string(),
  price: z.number(),
  currency: z.string(),
  imageUrl: z.string().nullable(),
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
});
export type Product = z.infer<typeof ProductSchema>;

/**
 * PRODUCTS_DATA_SOURCE flips this adapter from mock to live once the backend
 * ships a Product API (design doc §1, §4) — the path below is a placeholder,
 * not a real endpoint; update it when that lands. Every caller gets the same
 * Zod-validated shape regardless of source.
 */
const SOURCE = process.env.PRODUCTS_DATA_SOURCE ?? "mock";

export interface ListProductsParams {
  categorySlug?: string;
  search?: string;
  sort?: SortOption;
  [key: string]: string | number | boolean | undefined;
}

export async function listProducts(params: ListProductsParams = {}): Promise<Product[]> {
  "use cache";
  if (SOURCE === "live") {
    const { data } = await apiClient.get<unknown>("/catalog/products", { params });
    return z.array(ProductSchema).parse(data);
  }
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

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  if (SOURCE === "live") {
    const { data } = await apiClient.get<unknown>(`/catalog/products/${slug}`);
    return data ? ProductSchema.parse(data) : null;
  }
  const found = mockProducts.find((product) => product.slug === slug);
  return found ? ProductSchema.parse(found) : null;
}

function filterMockProducts(params: ListProductsParams) {
  const filtered = mockProducts.filter((product) => {
    if (params.categorySlug && product.categorySlug !== params.categorySlug) return false;
    if (params.search && !product.name.toLowerCase().includes(params.search.toLowerCase())) return false;
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
      return filtered;
  }
}
