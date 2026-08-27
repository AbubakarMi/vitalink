import "server-only";
import { getMockSalesTrend, getMockCategoryBreakdown, getMockTopVendorsByRevenue, getMockOrderStatusBreakdown } from "../mocks/admin-store";

/** Dashboard's Sales Trend + Category Breakdown, and the fuller /admin/analytics
 * page (super admin/Super Admin Dashboard.pdf) — no backend Analytics API
 * exists yet, mock-only. */

export async function getSalesTrend() {
  return getMockSalesTrend();
}

export async function getCategoryBreakdown() {
  return getMockCategoryBreakdown();
}

export async function getTopVendorsByRevenue() {
  return getMockTopVendorsByRevenue();
}

export async function getOrderStatusBreakdown() {
  return getMockOrderStatusBreakdown();
}
