import "server-only";
import { z } from "zod";
import { mockCategories } from "./mocks/categories";

const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  imageUrl: z.string().nullable(),
});
export type Category = z.infer<typeof CategorySchema>;

/**
 * Used by the public landing/catalog pages and the authenticated customer catalog.
 * No SOURCE toggle, unlike products.ts: `Brands.List`/`ProductCategories.List`
 * are `isAdmin: true` only in the backend's PermissionRegistry — no account type
 * (not even Customer) can read this data today, so there's no "live" branch to
 * flip to yet. See design doc §1 correction and §10 item 3 (required backend
 * addition: a public/customer-accessible read path).
 */
export async function listFeaturedCategories(): Promise<Category[]> {
  "use cache";
  return z.array(CategorySchema).parse(mockCategories);
}
