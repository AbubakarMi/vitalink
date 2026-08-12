import "server-only";
import { ApiError } from "./client";
import { verifySession } from "@/lib/auth/dal";
import { getVendorOrderDataset, getVendorOrder, updateVendorOrderStatus } from "./mocks/vendor-orders-store";

export type {
  MockVendorOrder,
  MockVendorOrderItem,
  MockWalletTransaction,
  VendorOrderStatus,
  VendorCustomerType,
  WalletTransactionType,
} from "./mocks/vendor-orders-store";
import type { MockVendorOrder, VendorOrderStatus } from "./mocks/vendor-orders-store";

/**
 * Vendor-side orders + wallet adapter. No Order/Wallet entity exists on the
 * real backend yet (frontend architecture doc §1) — every function below is
 * mocked against lib/api/mocks/vendor-orders-store.ts, same "no live branch
 * yet" situation as lib/api/orders.ts.
 */

async function currentVendorId(): Promise<string> {
  const session = await verifySession();
  if (!session) {
    throw new ApiError(401, "Not signed in.");
  }
  return session.userId;
}

export async function listRecentOrdersForVendor(limit = 7): Promise<MockVendorOrder[]> {
  const vendorId = await currentVendorId();
  return getVendorOrderDataset(vendorId).orders.slice(0, limit);
}

export async function listOrdersForVendor(): Promise<MockVendorOrder[]> {
  const vendorId = await currentVendorId();
  return getVendorOrderDataset(vendorId).orders;
}

export async function getVendorOrderById(orderId: string): Promise<MockVendorOrder | null> {
  const vendorId = await currentVendorId();
  return getVendorOrder(vendorId, orderId) ?? null;
}

export interface VendorOrderStats {
  totalSales: number;
  walletBalance: number;
  pendingCount: number;
  deliveredCount: number;
  cancelledCount: number;
  currency: string;
}

export async function getVendorOrderStats(): Promise<VendorOrderStats> {
  const vendorId = await currentVendorId();
  const { orders, transactions } = getVendorOrderDataset(vendorId);
  const totalSales = transactions.filter((t) => t.type === "Sale").reduce((sum, t) => sum + t.amount, 0);
  const walletBalance = transactions.reduce((sum, t) => sum + t.amount, 0);
  return {
    totalSales,
    walletBalance,
    pendingCount: orders.filter((o) => o.status === "Pending" || o.status === "Processing").length,
    deliveredCount: orders.filter((o) => o.status === "Delivered").length,
    cancelledCount: orders.filter((o) => o.status === "Cancelled").length,
    currency: "NGN",
  };
}

export async function listTransactionsForVendor() {
  const vendorId = await currentVendorId();
  return getVendorOrderDataset(vendorId).transactions;
}

export async function getVendorTransactionById(transactionId: string) {
  const vendorId = await currentVendorId();
  return getVendorOrderDataset(vendorId).transactions.find((t) => t.id === transactionId) ?? null;
}

const NEXT_STATUS: Partial<Record<VendorOrderStatus, VendorOrderStatus>> = {
  Pending: "Processing",
  Processing: "Transit",
  Transit: "Delivered",
};

export function nextOrderStatus(status: VendorOrderStatus): VendorOrderStatus | null {
  return NEXT_STATUS[status] ?? null;
}

export async function advanceVendorOrderStatus(orderId: string): Promise<MockVendorOrder> {
  const vendorId = await currentVendorId();
  const order = getVendorOrder(vendorId, orderId);
  if (!order) {
    throw new ApiError(404, "Order not found.");
  }
  const next = nextOrderStatus(order.status);
  if (!next) {
    throw new ApiError(422, `Order is already ${order.status.toLowerCase()}.`);
  }
  return updateVendorOrderStatus(vendorId, orderId, next);
}

export async function cancelVendorOrder(orderId: string): Promise<MockVendorOrder> {
  const vendorId = await currentVendorId();
  const order = getVendorOrder(vendorId, orderId);
  if (!order) {
    throw new ApiError(404, "Order not found.");
  }
  if (order.status === "Delivered" || order.status === "Cancelled") {
    throw new ApiError(422, `Order is already ${order.status.toLowerCase()}.`);
  }
  return updateVendorOrderStatus(vendorId, orderId, "Cancelled");
}
