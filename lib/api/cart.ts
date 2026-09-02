import "server-only";
import { z } from "zod";
import { apiClient, ApiError } from "./client";
import { relayCookies } from "./cookie-relay";

/**
 * The REAL cart — `AllowAnonymous` on every endpoint except checkout, backed
 * by a guest-cart cookie (`__Host-vitalink_cart`) the backend itself sets/
 * reads, or the signed-in customer's own session. Items are keyed by
 * `VendorOfferId` (see lib/api/marketplace.ts), not a flat product id — this
 * only makes sense once `PRODUCTS_DATA_SOURCE=live`'s Buy Box has a real
 * offer to add. lib/cart/store.tsx (the localStorage cart) is untouched and
 * stays the default for the mock catalog.
 *
 * IMPORTANT: every function here can receive a Set-Cookie from the backend
 * (a fresh guest-cart token on first add, or its removal on claim) and
 * relays it via relayCookies() — which Next.js only allows from a Server
 * Action or Route Handler, never a Server Component's render. Reads
 * (getCart) carry the same restriction, since GetCart can also mint a fresh
 * guest token — call it from app/api/cart/route.ts (a Route Handler) for
 * page-render use, not directly in a page/layout component.
 */

const BASE = "/users/customers/cart";

const CartItemSchema = z.object({
  id: z.string(),
  vendorOfferId: z.string(),
  quantity: z.number(),
  status: z.string(),
  productName: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  primaryImageUrl: z.string().nullable().optional(),
  availableQuantity: z.number().nullable().optional(),
});
export type CartItem = z.infer<typeof CartItemSchema>;

const CartResponseSchema = z.object({
  id: z.string(),
  ownerType: z.string(),
  status: z.string(),
  items: z.array(CartItemSchema),
});
export type Cart = z.infer<typeof CartResponseSchema>;

export async function getCart(): Promise<Cart> {
  const { data, setCookieHeaders } = await apiClient.get<unknown>(BASE);
  await relayCookies(setCookieHeaders);
  return CartResponseSchema.parse(data);
}

export async function addCartItem(vendorOfferId: string, quantity: number): Promise<Cart> {
  const { data, setCookieHeaders } = await apiClient.post<unknown>(BASE, { body: { vendorOfferId, quantity } });
  await relayCookies(setCookieHeaders);
  return CartResponseSchema.parse(data);
}

export async function changeCartItemQuantity(itemId: string, quantity: number): Promise<Cart> {
  const { data, setCookieHeaders } = await apiClient.put<unknown>(`${BASE}/items/${itemId}`, { body: { quantity } });
  await relayCookies(setCookieHeaders);
  return CartResponseSchema.parse(data);
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const { data, setCookieHeaders } = await apiClient.delete<unknown>(`${BASE}/items/${itemId}`);
  await relayCookies(setCookieHeaders);
  return CartResponseSchema.parse(data);
}

export async function clearCart(): Promise<Cart> {
  const { data, setCookieHeaders } = await apiClient.delete<unknown>(BASE);
  await relayCookies(setCookieHeaders);
  return CartResponseSchema.parse(data);
}

const ClaimGuestCartResponseSchema = z.object({
  cart: CartResponseSchema,
  /** Offers whose quantity got capped down while merging into the
   * customer's existing cart (e.g. hit a stock limit) — worth a "some
   * quantities were adjusted" notice if non-empty. */
  cappedOfferIds: z.array(z.string()),
});
export interface ClaimGuestCartResult {
  cart: Cart;
  cappedOfferIds: string[];
}

// ---- Checkout quote — the ONLY place cart pricing exists ----
// CartItemResponse (above) carries no price at all; a line's real price
// (base price, any volume-tier/discount applied, line total) only exists
// via this separate, authenticated-only call. A guest cart genuinely can't
// show pricing — RequireAuthorization() on GetCheckoutQuote is a real
// backend constraint, not something this app is choosing to withhold.

const EffectivePriceSchema = z.object({
  vendorOfferId: z.string(),
  baseUnitPrice: z.number(),
  volumeTierId: z.string().nullable().optional(),
  volumeUnitPrice: z.number().nullable().optional(),
  discountId: z.string().nullable().optional(),
  discountType: z.string().nullable().optional(),
  discountValue: z.number().nullable().optional(),
  effectiveUnitPrice: z.number(),
  quantity: z.number(),
  lineSubtotal: z.number(),
  discountAmount: z.number(),
  lineTotal: z.number(),
  currency: z.string(),
});

const CheckoutQuoteLineSchema = z.object({
  vendorOfferId: z.string(),
  productCategoryId: z.string(),
  vendorId: z.string(),
  productName: z.string(),
  sku: z.string(),
  lotNumber: z.string().nullable().optional(),
  condition: z.string(),
  quantity: z.number(),
  price: EffectivePriceSchema,
});
export type CheckoutQuoteLine = z.infer<typeof CheckoutQuoteLineSchema>;

const CheckoutQuoteResponseSchema = z.object({
  lines: z.array(CheckoutQuoteLineSchema),
  merchandiseTotal: z.number(),
  discountTotal: z.number(),
  taxTotal: z.number(),
  shippingTotal: z.number(),
  grandTotal: z.number(),
  currency: z.string(),
  quoteVersion: z.string(),
});
export type CheckoutQuote = z.infer<typeof CheckoutQuoteResponseSchema>;

export async function getCheckoutQuote(promoCodes: string[] = []): Promise<CheckoutQuote> {
  const { data } = await apiClient.post<unknown>("/users/customers/checkout/quote", { body: { promoCodes } });
  return CheckoutQuoteResponseSchema.parse(data);
}

/** Called right after a guest with cart items logs in/registers — merges
 * their guest cart into the now-authenticated customer's cart and clears
 * the guest cookie. No-ops safely (returns null) if there's no guest cart
 * to claim — the backend 404s that case (ApiError, not a normal return),
 * per ClaimGuestCart.cs's "GuestCart.NotFound". */
export async function claimGuestCart(): Promise<ClaimGuestCartResult | null> {
  try {
    const { data, setCookieHeaders } = await apiClient.post<unknown>(`${BASE}/claim`);
    await relayCookies(setCookieHeaders);
    return ClaimGuestCartResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
