import "server-only";
import { CATALOG_BRANDS } from "./mocks/products";

/**
 * Real manufacturer brand names drawn from the mock catalog (design doc §1) —
 * same "mock" vs "live" split as lib/api/products.ts, deferred until the
 * backend's Brands API is customer/public-readable (lib/api/categories.ts
 * has the same isAdmin-only note today).
 */
export async function listBrands(): Promise<string[]> {
  "use cache";
  return CATALOG_BRANDS;
}
