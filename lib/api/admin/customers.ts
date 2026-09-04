import "server-only";
import { listMockAdminCustomers, getMockAdminCustomerDetails } from "../mocks/admin-store";
import type { CustomerOrder } from "../customer-orders";

/**
 * Admin's Customers list — no backend Customers-listing endpoint exists (see
 * lib/api/mocks/admin-store.ts's customers section), so unlike vendors/staff/
 * roles this is mock-only for now, same category as lib/api/admin/orders.ts.
 */

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export async function listAdminCustomers(): Promise<AdminCustomer[]> {
  return listMockAdminCustomers();
}

export async function getAdminCustomerDetails(customerId: string): Promise<{ customer: AdminCustomer; orders: CustomerOrder[] } | null> {
  return getMockAdminCustomerDetails(customerId);
}
