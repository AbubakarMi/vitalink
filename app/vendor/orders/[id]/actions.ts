"use server";

import { revalidatePath } from "next/cache";
import { advanceVendorOrderStatus, cancelVendorOrder } from "@/lib/api/vendor-orders";

export async function advanceOrderAction(orderId: string) {
  await advanceVendorOrderStatus(orderId);
  revalidatePath(`/vendor/orders/${orderId}`);
  revalidatePath("/vendor/orders");
  revalidatePath("/vendor/dashboard");
  revalidatePath("/vendor/transactions");
}

export async function cancelOrderAction(orderId: string) {
  await cancelVendorOrder(orderId);
  revalidatePath(`/vendor/orders/${orderId}`);
  revalidatePath("/vendor/orders");
  revalidatePath("/vendor/dashboard");
}
