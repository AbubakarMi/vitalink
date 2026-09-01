import "server-only";
import { listMockAdminBuyers, getMockAdminBuyerDetails } from "../mocks/admin-store";
import type { BuyerOrder } from "../buyer-orders";

/**
 * Admin's Buyers list — no backend Customers-listing endpoint exists (see
 * lib/api/mocks/admin-store.ts's buyers section), so unlike vendors/staff/
 * roles this is mock-only for now, same category as lib/api/admin/orders.ts.
 */

export interface AdminBuyer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export async function listAdminBuyers(): Promise<AdminBuyer[]> {
  return listMockAdminBuyers();
}

export async function getAdminBuyerDetails(buyerId: string): Promise<{ buyer: AdminBuyer; orders: BuyerOrder[] } | null> {
  return getMockAdminBuyerDetails(buyerId);
}
