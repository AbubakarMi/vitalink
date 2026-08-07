import "server-only";
import { z } from "zod";
import { mockCart } from "./mocks/cart";

const CartItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  currency: z.string(),
});

const CartSchema = z.object({
  items: z.array(CartItemSchema),
  subtotal: z.number(),
  currency: z.string(),
});
export type Cart = z.infer<typeof CartSchema>;

/**
 * No SOURCE toggle: no Cart entity exists on the backend yet (design doc §1).
 * Once real, cart interactions move to client-driven TanStack Query (optimistic
 * add/remove) per design doc §4 — this server read stays as the initial-load path.
 */
export async function getCurrentCart(): Promise<Cart> {
  return CartSchema.parse(mockCart);
}
