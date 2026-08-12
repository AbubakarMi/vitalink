import "server-only";
import { randomUUID } from "node:crypto";
import type { Product } from "../products";
import { getVendorInventory } from "./vendor-inventory-store";

/**
 * Seeded order + wallet-transaction slice — no Order/Wallet entity exists on
 * the real backend yet (frontend architecture doc §1), same "no live branch
 * to flip to" situation as lib/api/orders.ts. Same globalThis-pinning
 * pattern as vendor-inventory-store.ts.
 */

export type VendorOrderStatus = "Pending" | "Processing" | "Transit" | "Delivered" | "Cancelled";
export type VendorCustomerType = "Hospital" | "Laboratory" | "Pharmacy" | "Clinic";

export interface MockVendorOrderItem {
  productId: string;
  productName: string;
  brand: string;
  quantity: number;
  unitPrice: number;
}

export interface MockVendorOrder {
  id: string;
  customerEntity: string;
  customerLocation: string;
  customerType: VendorCustomerType;
  items: MockVendorOrderItem[];
  itemCount: number;
  total: number;
  currency: string;
  status: VendorOrderStatus;
  placedAt: string;
}

export type WalletTransactionType = "Sale" | "Payout" | "Fee";

export interface MockWalletTransaction {
  id: string;
  type: WalletTransactionType;
  /** Signed: +Sale, -Payout, -Fee. */
  amount: number;
  currency: string;
  description: string;
  reference: string;
  createdAt: string;
}

export interface VendorOrderDataset {
  orders: MockVendorOrder[];
  transactions: MockWalletTransaction[];
}

const CUSTOMERS: { name: string; location: string; type: VendorCustomerType }[] = [
  { name: "Mecoson Medical Supplies", location: "Imo, Nigeria", type: "Hospital" },
  { name: "Medixis Supply Solutions", location: "Port-Harcourt, Nigeria", type: "Laboratory" },
  { name: "BioQuest Medical Supply", location: "Lagos, Nigeria", type: "Hospital" },
  { name: "ApexCare Equipment", location: "Oyo, Nigeria", type: "Clinic" },
  { name: "Omnicor Healthcare", location: "Sokoto, Nigeria", type: "Hospital" },
  { name: "Vitalsource Medical", location: "Benin, Nigeria", type: "Pharmacy" },
  { name: "Sentinel Diagnostics Ltd", location: "Enugu, Nigeria", type: "Laboratory" },
  { name: "Crestview Hospital Group", location: "Abuja, Nigeria", type: "Hospital" },
];

const STATUS_CYCLE: VendorOrderStatus[] = ["Delivered", "Delivered", "Transit", "Processing", "Pending", "Delivered", "Cancelled", "Delivered"];

function buildOrderItems(catalog: Product[], seedIndex: number): MockVendorOrderItem[] {
  if (catalog.length === 0) {
    return [{ productId: "unknown", productName: "Vitalink order", brand: "—", quantity: 1, unitPrice: 25500 }];
  }
  const lineCount = (seedIndex % 3) + 1;
  return Array.from({ length: lineCount }, (_, lineIndex) => {
    const product = catalog[(seedIndex * 3 + lineIndex + 1) % catalog.length];
    const quantity = ((seedIndex + lineIndex) % 4) + 1;
    return {
      productId: product.id,
      productName: product.name,
      brand: product.brand ?? "—",
      quantity,
      unitPrice: product.price,
    };
  });
}

function seedVendorOrders(inventory: Product[]): MockVendorOrder[] {
  const now = Date.now();
  const catalog = inventory.filter((product) => product.status !== "Rejected" && product.status !== "PendingReview");
  const orderCount = Math.min(14, Math.max(8, catalog.length));

  return Array.from({ length: orderCount }, (_, i) => {
    const customer = CUSTOMERS[i % CUSTOMERS.length];
    const items = buildOrderItems(catalog, i);
    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    return {
      id: `VIT-${(100000 + i * 137).toString(36).toUpperCase()}`,
      customerEntity: customer.name,
      customerLocation: customer.location,
      customerType: customer.type,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      total,
      currency: "NGN",
      status: STATUS_CYCLE[i % STATUS_CYCLE.length],
      placedAt: new Date(now - (orderCount - i) * 86_400_000 * 1.6).toISOString(),
    };
  }).sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
}

/** A Sale transaction per Delivered order, plus a couple of Payouts and a
 * platform fee interspersed by date — an illustrative wallet ledger, not a
 * real one (there's no Wallet entity on the backend), but computed from the
 * actual seeded orders rather than a fabricated headline number. */
function buildTransactions(orders: MockVendorOrder[]): MockWalletTransaction[] {
  const sales: MockWalletTransaction[] = orders
    .filter((order) => order.status === "Delivered")
    .map((order) => ({
      id: randomUUID(),
      type: "Sale" as const,
      amount: order.total,
      currency: order.currency,
      description: `Sale — ${order.customerEntity}`,
      reference: order.id,
      createdAt: order.placedAt,
    }))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const transactions = [...sales];
  const payoutAnchors = [sales[Math.floor(sales.length / 3)], sales[Math.floor((sales.length * 2) / 3)]];
  for (const anchor of payoutAnchors) {
    if (!anchor) continue;
    const priorSales = sales.slice(0, sales.indexOf(anchor) + 1).reduce((sum, t) => sum + t.amount, 0);
    transactions.push({
      id: randomUUID(),
      type: "Payout" as const,
      amount: -Math.round(priorSales * 0.4),
      currency: "NGN",
      description: "Payout to settlement account",
      reference: `PO-${randomUUID().slice(0, 8).toUpperCase()}`,
      createdAt: new Date(new Date(anchor.createdAt).getTime() + 86_400_000).toISOString(),
    });
  }

  const totalSalesAmount = sales.reduce((sum, t) => sum + t.amount, 0);
  if (totalSalesAmount > 0) {
    transactions.push({
      id: randomUUID(),
      type: "Fee" as const,
      amount: -Math.round(totalSalesAmount * 0.02),
      currency: "NGN",
      description: "Platform commission (2%)",
      reference: `FEE-${new Date().toISOString().slice(0, 7)}`,
      createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    });
  }

  return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function seedVendorDataset(inventory: Product[]): VendorOrderDataset {
  const orders = seedVendorOrders(inventory);
  return { orders, transactions: buildTransactions(orders) };
}

const globalForVendorOrders = globalThis as unknown as { __vitalinkVendorOrders?: Map<string, VendorOrderDataset> };
const ordersByVendorId = globalForVendorOrders.__vitalinkVendorOrders ?? new Map<string, VendorOrderDataset>();
globalForVendorOrders.__vitalinkVendorOrders = ordersByVendorId;

export function getVendorOrderDataset(vendorId: string): VendorOrderDataset {
  let dataset = ordersByVendorId.get(vendorId);
  if (!dataset) {
    dataset = seedVendorDataset(getVendorInventory(vendorId));
    ordersByVendorId.set(vendorId, dataset);
  }
  return dataset;
}

export function getVendorOrder(vendorId: string, orderId: string): MockVendorOrder | undefined {
  return getVendorOrderDataset(vendorId).orders.find((order) => order.id === orderId);
}

export function updateVendorOrderStatus(vendorId: string, orderId: string, status: VendorOrderStatus): MockVendorOrder {
  const dataset = getVendorOrderDataset(vendorId);
  const order = dataset.orders.find((o) => o.id === orderId);
  if (!order) {
    throw new Error(`Order ${orderId} not found for vendor ${vendorId}`);
  }
  order.status = status;
  if (status === "Delivered" && !dataset.transactions.some((t) => t.reference === order.id && t.type === "Sale")) {
    dataset.transactions.unshift({
      id: randomUUID(),
      type: "Sale",
      amount: order.total,
      currency: order.currency,
      description: `Sale — ${order.customerEntity}`,
      reference: order.id,
      createdAt: new Date().toISOString(),
    });
  }
  return order;
}
