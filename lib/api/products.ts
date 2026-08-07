import "server-only";
import { z } from "zod";
import { apiClient } from "./client";
import { mockProducts } from "./mocks/products";

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
  return mockProducts.filter((product) => {
    if (params.categorySlug && product.categorySlug !== params.categorySlug) return false;
    if (params.search && !product.name.toLowerCase().includes(params.search.toLowerCase())) return false;
    return true;
  });
}
