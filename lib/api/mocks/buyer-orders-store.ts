import "server-only";
import { randomUUID } from "node:crypto";
import type { Product } from "../products";

/**
 * Per-buyer order history — no Order entity exists on the backend at all
 * (design doc §1, same as lib/api/orders.ts's global mock list). This is a
 * separate, per-buyer-scoped store (globalThis-pinned like every other mock
 * store) so checkout can create real orders and Order History reflects what
 * the signed-in buyer actually bought, rather than one shared fixture list
 * every buyer sees identically.
 */

export type BuyerOrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export interface BuyerOrderItem {
  productId: string;
  name: string;
  sku?: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
}

export interface BuyerDeliveryAddress {
  addressLine: string;
  city: string;
  state: string;
  country: string;
}

export interface BuyerOrder {
  id: string;
  items: BuyerOrderItem[];
  itemCount: number;
  subtotal: number;
  delivery: number;
  total: number;
  currency: string;
  status: BuyerOrderStatus;
  placedAt: string;
  deliveryAddress: BuyerDeliveryAddress;
}

const STATUS_CYCLE: BuyerOrderStatus[] = ["Delivered", "Delivered", "Shipped", "Processing", "Delivered"];
const DEFAULT_ADDRESS: BuyerDeliveryAddress = {
  addressLine: "No 12 Nza Street, Independence Layout",
  city: "Enugu",
  state: "Enugu",
  country: "Nigeria",
};

function seedOrders(catalog: Product[]): BuyerOrder[] {
  if (catalog.length === 0) return [];
  const now = Date.now();
  const orderCount = Math.min(5, catalog.length);
  return Array.from({ length: orderCount }, (_, i) => {
    const product = catalog[i % catalog.length];
    const quantity = (i % 3) + 1;
    const items: BuyerOrderItem[] = [
      {
        productId: product.id,
        name: product.name,
        sku: product.brandSku,
        imageUrl: product.imageUrl,
        quantity,
        unitPrice: product.price,
      },
    ];
    const subtotal = quantity * product.price;
    const delivery = 5000;
    return {
      id: `VIT-${(200000 + i * 211).toString(36).toUpperCase()}`,
      items,
      itemCount: quantity,
      subtotal,
      delivery,
      total: subtotal + delivery,
      currency: "NGN",
      status: STATUS_CYCLE[i % STATUS_CYCLE.length],
      placedAt: new Date(now - (orderCount - i) * 86_400_000 * 4).toISOString(),
      deliveryAddress: DEFAULT_ADDRESS,
    };
  }).sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
}

const globalForBuyerOrders = globalThis as unknown as { __vitalinkBuyerOrders?: Map<string, BuyerOrder[]> };
const ordersByBuyerId = globalForBuyerOrders.__vitalinkBuyerOrders ?? new Map<string, BuyerOrder[]>();
globalForBuyerOrders.__vitalinkBuyerOrders = ordersByBuyerId;

export function getBuyerOrders(buyerId: string, catalog: Product[]): BuyerOrder[] {
  let orders = ordersByBuyerId.get(buyerId);
  if (!orders) {
    orders = seedOrders(catalog);
    ordersByBuyerId.set(buyerId, orders);
  }
  return orders;
}

export function getBuyerOrder(buyerId: string, orderId: string, catalog: Product[]): BuyerOrder | undefined {
  return getBuyerOrders(buyerId, catalog).find((order) => order.id === orderId);
}

export function addBuyerOrder(
  buyerId: string,
  input: { items: BuyerOrderItem[]; deliveryAddress: BuyerDeliveryAddress; delivery: number },
): BuyerOrder {
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const order: BuyerOrder = {
    id: `VIT-${randomUUID().slice(0, 8).toUpperCase()}`,
    items: input.items,
    itemCount: input.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    delivery: input.delivery,
    total: subtotal + input.delivery,
    currency: "NGN",
    status: "Pending",
    placedAt: new Date().toISOString(),
    deliveryAddress: input.deliveryAddress,
  };
  const orders = ordersByBuyerId.get(buyerId) ?? [];
  orders.unshift(order);
  ordersByBuyerId.set(buyerId, orders);
  return order;
}
