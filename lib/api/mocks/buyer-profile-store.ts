import "server-only";
import { findMockUserByEmail } from "./auth-store";

/**
 * Per-buyer delivery address — no such field exists on the backend's user
 * record yet, so this is a small standalone mock store (globalThis-pinned
 * like every other mock store), keyed by userId. Basic info (name/email/
 * phone) already comes from lib/api/auth.ts's getCurrentUser() — this store
 * only covers what that doesn't: the delivery address shown on Settings and
 * prefilled at checkout.
 */

export interface MockDeliveryAddress {
  country: string;
  state: string;
  city: string;
  addressLine: string;
}

const globalForBuyerProfiles = globalThis as unknown as { __vitalinkBuyerProfiles?: Map<string, MockDeliveryAddress> };
const addressByUserId = globalForBuyerProfiles.__vitalinkBuyerProfiles ?? new Map<string, MockDeliveryAddress>();
globalForBuyerProfiles.__vitalinkBuyerProfiles = addressByUserId;

/** The seeded buyer@vitalink.dev demo account otherwise has an empty
 * Settings/checkout address on first login — same reasoning as
 * vendor-profile-store's seedDemoVendorProfileOnce, so the demo credentials
 * in docs/MOCK_AUTH.md land somewhere populated, not blank. */
function seedDemoBuyerAddressOnce(): void {
  const demoUser = findMockUserByEmail("buyer@vitalink.dev");
  if (!demoUser || addressByUserId.has(demoUser.userId)) {
    return;
  }
  addressByUserId.set(demoUser.userId, {
    country: "Nigeria",
    state: "Enugu",
    city: "Enugu",
    addressLine: "No 12 Nza Street, Independence Layout",
  });
}
seedDemoBuyerAddressOnce();

export function getMockDeliveryAddress(userId: string): MockDeliveryAddress | null {
  return addressByUserId.get(userId) ?? null;
}

export function setMockDeliveryAddress(userId: string, address: MockDeliveryAddress): MockDeliveryAddress {
  addressByUserId.set(userId, address);
  return address;
}
