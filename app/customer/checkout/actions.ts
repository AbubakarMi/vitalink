"use server";

import { createOrderFromCheckout, type CustomerOrderItem, type CustomerDeliveryAddress } from "@/lib/api/customer-orders";
import { ApiError } from "@/lib/api/client";

export interface ActionResult<T> {
  data?: T;
  error?: string;
}

/** No real payment gateway is integrated (no Paystack keys, no backend
 * Payment endpoint) — this creates a real Pending order against the mock
 * order store, but doesn't process any actual payment. See
 * components/customer/checkout-view.tsx's disclosure. The address itself is
 * already a saved one from the customer's address book (lib/api/addresses.ts,
 * picked in checkout-view.tsx) — no separate "remember this address" write
 * needed, unlike the old single free-text delivery address this replaced. */
export async function completeCheckoutAction(
  items: CustomerOrderItem[],
  address: CustomerDeliveryAddress,
): Promise<ActionResult<{ orderId: string }>> {
  try {
    const order = await createOrderFromCheckout({ items, deliveryAddress: address });
    return { data: { orderId: order.id } };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't complete checkout." };
  }
}
