import "server-only";
import { z } from "zod";
import { apiClient, ApiError } from "../client";
import { pagedResult } from "../schemas/pagination";
import { ADMIN_SOURCE } from "./data-source";
import {
  listMockAdminProducts,
  getMockAdminProductDetails,
  approveMockAdminProduct,
  rejectMockAdminProduct,
} from "../mocks/admin-store";

/**
 * Admin product-moderation adapter — real endpoints exist on the backend
 * (vitalink-backend Web.Api/Endpoints/Administration/Products/*:
 * GetAdminProducts, GetProductDetails, ApproveProduct, RejectProduct,
 * GetProductDuplicates, GetProductMergePreview, MergeProducts) backing the
 * "Global Inventory" screen (super admin/Vendor Inventory.pdf).
 *
 * The field names/shape below are inferred from the mockup and the sibling
 * admin adapters' conventions (lib/api/admin/vendors.ts, staff.ts) — this
 * hasn't been checked against the actual GetAdminProducts response DTO yet
 * (deferred per the "build the frontend now, review the backend later"
 * instruction). Every field the UI reads is optional/nullable here so a
 * mismatch fails soft (missing data) rather than throwing a Zod parse error
 * — narrow it to the real shape once the backend is reviewed.
 */

const BASE = "/admin/products";

export const ADMIN_PRODUCT_STATUSES = ["Active", "PendingReview", "OutOfStock", "Archived", "Rejected"] as const;
export type AdminProductStatus = (typeof ADMIN_PRODUCT_STATUSES)[number];

const AdminProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  /** Full gallery — primary + supporting images (see the New Product
   * wizard's image upload step). Optional since only vendor-submitted
   * products (as opposed to the static seed catalog) populate more than
   * imageUrl. */
  images: z.array(z.object({ url: z.string(), isPrimary: z.boolean() })).nullable().optional(),
  price: z.number(),
  originalPrice: z.number().nullable().optional(),
  stock: z.number().nullable().optional(),
  lowStockThreshold: z.number().nullable().optional(),
  vendorId: z.string().nullable().optional(),
  vendorName: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  categoryLabel: z.string().nullable().optional(),
  status: z.string(),
  createdAt: z.string().nullable().optional(),
  shortDescription: z.string().nullable().optional(),
  manufacturedIn: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  freeDelivery: z.boolean().nullable().optional(),
  technicalSpecs: z.array(z.object({ label: z.string(), value: z.string() })).nullable().optional(),
  includedAccessories: z.array(z.string()).nullable().optional(),
  clinicalUseCases: z.array(z.string()).nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
});
export type AdminProduct = z.infer<typeof AdminProductSchema>;

const PagedAdminProductsSchema = pagedResult(AdminProductSchema);

export interface ListAdminProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  [key: string]: string | number | boolean | undefined;
}

export async function listAdminProducts(params: ListAdminProductsParams = {}) {
  if (ADMIN_SOURCE === "mock") {
    return PagedAdminProductsSchema.parse(listMockAdminProducts(params));
  }
  const { data } = await apiClient.get<unknown>(BASE, { params });
  return PagedAdminProductsSchema.parse(data);
}

export async function getAdminProductDetails(productId: string) {
  if (ADMIN_SOURCE === "mock") {
    return AdminProductSchema.parse(getMockAdminProductDetails(productId));
  }
  const { data } = await apiClient.get<unknown>(`${BASE}/${productId}`);
  return AdminProductSchema.parse(data);
}

export async function approveAdminProduct(productId: string) {
  if (ADMIN_SOURCE === "mock") {
    approveMockAdminProduct(productId);
    return;
  }
  await apiClient.put(`${BASE}/${productId}/approve`);
}

export async function rejectAdminProduct(productId: string, reason: string) {
  if (ADMIN_SOURCE === "mock") {
    if (!reason.trim()) throw new ApiError(400, "A reason is required.");
    rejectMockAdminProduct(productId, reason);
    return;
  }
  await apiClient.put(`${BASE}/${productId}/reject`, { body: { reason } });
}
