import "server-only";
import { randomUUID } from "node:crypto";
import type { Product } from "../products";

/**
 * Per-customer order history — no Order entity exists on the backend at all
 * (design doc §1, same as lib/api/orders.ts's global mock list). This is a
 * separate, per-customer-scoped store (globalThis-pinned like every other mock
 * store) so checkout can create real orders and Order History reflects what
 * the signed-in customer actually bought, rather than one shared fixture list
 * every customer sees identically.
 */

export type CustomerOrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export interface CustomerOrderItem {
  productId: string;
  name: string;
  sku?: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
}

export interface CustomerDeliveryAddress {
  addressLine: string;
  city: string;
  state: string;
  country: string;
}

export interface CustomerOrder {
  id: string;
  items: CustomerOrderItem[];
  itemCount: number;
  subtotal: number;
  delivery: number;
  total: number;
  currency: string;
  status: CustomerOrderStatus;
  placedAt: string;
  deliveryAddress: CustomerDeliveryAddress;
}

const STATUS_CYCLE: CustomerOrderStatus[] = ["Delivered", "Delivered", "Shipped", "Processing", "Delivered"];
const DEFAULT_ADDRESS: CustomerDeliveryAddress = {
  addressLine: "No 12 Nza Street, Independence Layout",
  city: "Enugu",
  state: "Enugu",
  country: "Nigeria",
};

function seedOrders(catalog: Product[]): CustomerOrder[] {
  if (catalog.length === 0) return [];
  const now = Date.now();
  const orderCount = Math.min(5, catalog.length);
  return Array.from({ length: orderCount }, (_, i) => {
    const product = catalog[i % catalog.length];
    const quantity = (i % 3) + 1;
    const items: CustomerOrderItem[] = [
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

const globalForCustomerOrders = globalThis as unknown as { __vitalinkCustomerOrders?: Map<string, CustomerOrder[]> };
const ordersByCustomerId = globalForCustomerOrders.__vitalinkCustomerOrders ?? new Map<string, CustomerOrder[]>();
globalForCustomerOrders.__vitalinkCustomerOrders = ordersByCustomerId;

export function getCustomerOrders(customerId: string, catalog: Product[]): CustomerOrder[] {
  let orders = ordersByCustomerId.get(customerId);
  if (!orders) {
    orders = seedOrders(catalog);
    ordersByCustomerId.set(customerId, orders);
  }
  return orders;
}

export function getCustomerOrder(customerId: string, orderId: string, catalog: Product[]): CustomerOrder | undefined {
  return getCustomerOrders(customerId, catalog).find((order) => order.id === orderId);
}

export function addCustomerOrder(
  customerId: string,
  input: { items: CustomerOrderItem[]; deliveryAddress: CustomerDeliveryAddress; delivery: number },
): CustomerOrder {
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const order: CustomerOrder = {
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
  const orders = ordersByCustomerId.get(customerId) ?? [];
  orders.unshift(order);
  ordersByCustomerId.set(customerId, orders);
  return order;
}
