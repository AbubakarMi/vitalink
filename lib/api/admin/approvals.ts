import "server-only";
import { listVendors } from "./vendors";
import { listAdminProducts } from "./products";

/**
 * Pending-count badge for the sidebar's "Approval" module (Vendor Review +
 * Product Review) — how many items are sitting unactioned right now, same
 * "unread count" idea as an inbox badge. Reuses each list adapter's own
 * `status` filter + `totalCount` (pageSize: 1, so it costs one row of data
 * transfer) rather than adding a dedicated count endpoint/mock function —
 * works identically whether ADMIN_DATA_SOURCE is mock or live.
 *
 * "Pending" only, not "UnderReview" too — UnderReview means an admin
 * already picked it up, so it's no longer unread the way a fresh
 * application/submission is.
 */
export interface PendingApprovalCounts {
  vendors: number;
  products: number;
  total: number;
}

export async function getPendingApprovalCounts(): Promise<PendingApprovalCounts> {
  const [vendorsResult, productsResult] = await Promise.all([
    listVendors({ pageSize: 1, status: "Pending" }),
    listAdminProducts({ pageSize: 1, status: "PendingReview" }),
  ]);
  const vendors = vendorsResult.totalCount;
  const products = productsResult.totalCount;
  return { vendors, products, total: vendors + products };
}
