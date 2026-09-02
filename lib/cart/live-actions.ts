"use server";

import { addCartItem, changeCartItemQuantity, removeCartItem, clearCart, claimGuestCart, type Cart } from "@/lib/api/cart";
import { ApiError } from "@/lib/api/client";

export interface CartActionResult {
  error?: string;
  cart?: Cart;
}

/** Every mutation returns the fresh cart directly (the real backend already
 * hands it back on every write) so LiveCartView can update from the action's
 * result instead of a separate re-fetch. */

export async function addToLiveCartAction(vendorOfferId: string, quantity: number): Promise<CartActionResult> {
  try {
    const cart = await addCartItem(vendorOfferId, quantity);
    return { cart };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't add this to your cart." };
  }
}

export async function changeLiveCartQuantityAction(itemId: string, quantity: number): Promise<CartActionResult> {
  try {
    const cart = await changeCartItemQuantity(itemId, quantity);
    return { cart };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't update that quantity." };
  }
}

export async function removeLiveCartItemAction(itemId: string): Promise<CartActionResult> {
  try {
    const cart = await removeCartItem(itemId);
    return { cart };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't remove that item." };
  }
}

export async function clearLiveCartAction(): Promise<CartActionResult> {
  try {
    const cart = await clearCart();
    return { cart };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't clear your cart." };
  }
}

/** Fire-and-forget after a successful login/register — merges a guest cart
 * into the now-authenticated customer's, if one exists. Failure here
 * shouldn't block login, so it's swallowed rather than surfaced. */
export async function claimGuestCartOnLoginAction(): Promise<void> {
  await claimGuestCart().catch(() => null);
}
