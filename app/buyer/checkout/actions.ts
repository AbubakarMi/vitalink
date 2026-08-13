"use server";

import { createOrderFromCheckout, type BuyerOrderItem } from "@/lib/api/buyer-orders";
import { saveDeliveryAddress, type DeliveryAddress } from "@/lib/api/buyer-profile";
import { ApiError } from "@/lib/api/client";

export interface ActionResult<T> {
  data?: T;
  error?: string;
}

/** No real payment gateway is integrated (no Paystack keys, no backend
 * Payment endpoint) — this creates a real Pending order against the mock
 * order store and saves the delivery address, but doesn't process any
 * actual payment. See components/buyer/checkout-view.tsx's disclosure. */
export async function completeCheckoutAction(
  items: BuyerOrderItem[],
  address: DeliveryAddress,
): Promise<ActionResult<{ orderId: string }>> {
  try {
    await saveDeliveryAddress(address);
    const order = await createOrderFromCheckout({ items, deliveryAddress: address });
    return { data: { orderId: order.id } };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't complete checkout." };
  }
}
