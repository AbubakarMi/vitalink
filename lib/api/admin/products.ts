import "server-only";
import { z } from "zod";
import { apiClient, ApiError } from "../client";
import { pagedResult } from "../schemas/pagination";
import { ADMIN_SOURCE } from "./data-source";
import { toBackendListParams } from "./query-params";
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
 * CONFIRMED LIVE (2026-09-02, not inferred anymore): AdminProductSchema
 * below does NOT match GetProductsResponse at all. Real field names are
 * `productId` (not `id`), `approvalStatus` (not `status`), `brandName`/
 * `categoryName` (not `brand`/`categoryLabel`), `primaryImageUrl` (not
 * `imageUrl`), `submittedByVendorId` (not `vendorId`) — and there is no
 * `price` field on this response at all (`price` is required/non-nullable
 * below, so a live call throws a Zod parse error immediately, every time).
 * This is the Product/Offer split (BACKEND_INTEGRATION_GUIDE.md §2.5) —
 * "price" genuinely doesn't belong on a Product, only on its Offers — so
 * this isn't a quick field-rename fix, it needs the real redesign that
 * section already flags. The pagination/OrderBy params below are fixed and
 * correct regardless of that; only response parsing is still broken.
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
  // ApprovalStatus is the real backend filter field, but its vocabulary
  // (PendingReview/Approved/Rejected) only partially overlaps this app's
  // status vocabulary (ADMIN_PRODUCT_STATUSES) — passed through best-effort
  // for the one value that does line up (PendingReview, from the Approval
  // nav module's deep link). Moot until the response-shape mismatch above
  // is fixed anyway.
  const { data } = await apiClient.get<unknown>(BASE, {
    params: {
      ...toBackendListParams(params),
      OrderBy: "createdAt desc",
      ...(params.status ? { ApprovalStatus: params.status } : {}),
    },
  });
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
