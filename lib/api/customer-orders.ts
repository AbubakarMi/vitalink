import "server-only";
import { ApiError } from "./client";
import { verifySession } from "@/lib/auth/dal";
import { listProducts } from "./products";
import { DELIVERY_FEE } from "@/lib/cart/constants";
import {
  getCustomerOrders,
  getCustomerOrder,
  addCustomerOrder,
  type CustomerOrder,
  type CustomerOrderItem,
  type CustomerDeliveryAddress,
} from "./mocks/customer-orders-store";

export type { CustomerOrder, CustomerOrderItem, CustomerOrderStatus, CustomerDeliveryAddress } from "./mocks/customer-orders-store";

/**
 * Customer-side order history + checkout adapter. No Order entity exists on
 * the backend yet (design doc §1) — mocked against
 * lib/api/mocks/customer-orders-store.ts, scoped to the signed-in customer.
 */

async function currentCustomerId(): Promise<string> {
  const session = await verifySession();
  if (!session) {
    throw new ApiError(401, "Not signed in.");
  }
  return session.userId;
}

export async function listOrdersForCustomer(): Promise<CustomerOrder[]> {
  const customerId = await currentCustomerId();
  const catalog = await listProducts();
  return getCustomerOrders(customerId, catalog);
}

export async function getCustomerOrderById(orderId: string): Promise<CustomerOrder | null> {
  const customerId = await currentCustomerId();
  const catalog = await listProducts();
  return getCustomerOrder(customerId, orderId, catalog) ?? null;
}

export interface CreateOrderInput {
  items: CustomerOrderItem[];
  deliveryAddress: CustomerDeliveryAddress;
}

export async function createOrderFromCheckout(input: CreateOrderInput): Promise<CustomerOrder> {
  const customerId = await currentCustomerId();
  if (input.items.length === 0) {
    throw new ApiError(422, "Your cart is empty.");
  }
  return addCustomerOrder(customerId, { items: input.items, deliveryAddress: input.deliveryAddress, delivery: DELIVERY_FEE });
}
