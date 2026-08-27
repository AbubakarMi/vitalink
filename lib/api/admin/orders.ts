import "server-only";
import { listMockOrders, countMockOrdersPending, getMockOrderDetails, type ListMockOrdersParams } from "../mocks/admin-store";

/**
 * Platform-wide order fulfillment — no backend Order API exists yet (design
 * doc §1), so unlike vendors/staff/roles this is mock-only for now, the
 * same way lib/api/products.ts is mock-only until a real Product API
 * exists. Swap in a real branch here once the backend has one — same shape
 * as lib/api/admin/vendors.ts's ADMIN_SOURCE seam.
 */

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  vendorName: string;
  itemCount: number;
  total: number;
  status: "Pending" | "Processing" | "Transit" | "Delivered" | "Cancelled";
  placedAt: string;
}

export async function listAdminOrders(params: ListMockOrdersParams = {}) {
  return listMockOrders(params);
}

export async function countPendingOrders(): Promise<number> {
  return countMockOrdersPending();
}

export async function getAdminOrderDetails(orderId: string) {
  return getMockOrderDetails(orderId);
}
