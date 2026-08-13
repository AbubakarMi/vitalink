import "server-only";
import { ApiError } from "./client";
import { verifySession } from "@/lib/auth/dal";
import { listProducts } from "./products";
import { DELIVERY_FEE } from "@/lib/cart/constants";
import {
  getBuyerOrders,
  getBuyerOrder,
  addBuyerOrder,
  type BuyerOrder,
  type BuyerOrderItem,
  type BuyerDeliveryAddress,
} from "./mocks/buyer-orders-store";

export type { BuyerOrder, BuyerOrderItem, BuyerOrderStatus, BuyerDeliveryAddress } from "./mocks/buyer-orders-store";

/**
 * Buyer-side order history + checkout adapter. No Order entity exists on
 * the backend yet (design doc §1) — mocked against
 * lib/api/mocks/buyer-orders-store.ts, scoped to the signed-in buyer.
 */

async function currentBuyerId(): Promise<string> {
  const session = await verifySession();
  if (!session) {
    throw new ApiError(401, "Not signed in.");
  }
  return session.userId;
}

export async function listOrdersForBuyer(): Promise<BuyerOrder[]> {
  const buyerId = await currentBuyerId();
  const catalog = await listProducts();
  return getBuyerOrders(buyerId, catalog);
}

export async function getBuyerOrderById(orderId: string): Promise<BuyerOrder | null> {
  const buyerId = await currentBuyerId();
  const catalog = await listProducts();
  return getBuyerOrder(buyerId, orderId, catalog) ?? null;
}

export interface CreateOrderInput {
  items: BuyerOrderItem[];
  deliveryAddress: BuyerDeliveryAddress;
}

export async function createOrderFromCheckout(input: CreateOrderInput): Promise<BuyerOrder> {
  const buyerId = await currentBuyerId();
  if (input.items.length === 0) {
    throw new ApiError(422, "Your cart is empty.");
  }
  return addBuyerOrder(buyerId, { items: input.items, deliveryAddress: input.deliveryAddress, delivery: DELIVERY_FEE });
}
