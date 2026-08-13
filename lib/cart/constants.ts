/** Flat delivery fee — no shipping-rate/logistics integration exists yet.
 * Shared between the cart/checkout client UI and the server-side order
 * creation adapter (lib/api/buyer-orders.ts) so the total shown before
 * checkout matches what the order actually records. */
export const DELIVERY_FEE = 5000;
