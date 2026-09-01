import "server-only";
import { z } from "zod";
import { apiClient } from "../client";
import { ADMIN_SOURCE } from "./data-source";
import {
  listMockProductCategories,
  createMockProductCategory,
  setMockProductCategoryActive,
} from "../mocks/admin-store";

/**
 * Admin product-category CRUD — real endpoints exist on the backend
 * (Web.Api/Endpoints/Administration/ProductCategories/*: GetProductCategories,
 * GetProductCategoryDetails, CreateProductCategory, UpdateProductCategory,
 * ActivateProductCategory, DeactivateProductCategory — see
 * docs/BACKEND_INTEGRATION_GUIDE.md §3). Deactivate rather than delete: a
 * category may already be referenced by products, so it's turned off (hidden
 * from new listings) rather than removed outright. Shape here is inferred,
 * not yet checked against the real response DTO.
 */

const BASE = "/admin/product-categories";

const AdminProductCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string().nullable().optional(),
});
export type AdminProductCategory = z.infer<typeof AdminProductCategorySchema>;

export async function listAdminProductCategories(): Promise<AdminProductCategory[]> {
  if (ADMIN_SOURCE === "mock") {
    return z.array(AdminProductCategorySchema).parse(listMockProductCategories());
  }
  const { data } = await apiClient.get<unknown>(BASE);
  return z.array(AdminProductCategorySchema).parse(data);
}

export interface CreateAdminProductCategoryInput {
  name: string;
  description: string;
}

export async function createAdminProductCategory(
  input: CreateAdminProductCategoryInput,
): Promise<AdminProductCategory> {
  if (ADMIN_SOURCE === "mock") {
    return AdminProductCategorySchema.parse(createMockProductCategory(input));
  }
  const { data } = await apiClient.post<unknown>(BASE, { body: input });
  return AdminProductCategorySchema.parse(data);
}

export async function setAdminProductCategoryActive(id: string, isActive: boolean): Promise<AdminProductCategory> {
  if (ADMIN_SOURCE === "mock") {
    return AdminProductCategorySchema.parse(setMockProductCategoryActive(id, isActive));
  }
  const { data } = await apiClient.put<unknown>(`${BASE}/${id}/${isActive ? "activate" : "deactivate"}`);
  return AdminProductCategorySchema.parse(data);
}
