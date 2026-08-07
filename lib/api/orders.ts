import "server-only";
import { z } from "zod";
import { mockOrders } from "./mocks/orders";

const OrderStatusSchema = z.enum(["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]);

const OrderSchema = z.object({
  id: z.string(),
  status: OrderStatusSchema,
  placedAt: z.string(),
  total: z.number(),
  currency: z.string(),
  itemCount: z.number(),
});
export type Order = z.infer<typeof OrderSchema>;

/** No SOURCE toggle: no Order entity exists on the backend at all yet (design doc §1). */
export async function listOrdersForCurrentUser(): Promise<Order[]> {
  return z.array(OrderSchema).parse(mockOrders);
}
