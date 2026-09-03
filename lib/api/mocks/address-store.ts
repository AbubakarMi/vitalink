import "server-only";
import { randomUUID } from "crypto";
import { findMockUserByEmail } from "./auth-store";

/**
 * Mock backing store for lib/api/addresses.ts, shaped to match the real
 * backend's CustomerAddress entity exactly (Domain/Identity/Customer/
 * CustomerAddress.cs) rather than the old single-address MockDeliveryAddress
 * (buyer-profile-store.ts, now superseded by this) — a buyer can save
 * several labeled addresses (Home/Office/Department/Other) and mark one as
 * the default shipping and/or billing address, same as the real API.
 * globalThis-pinned like every other mock store, keyed by userId.
 */

export type MockAddressLabel = "Home" | "Office" | "Department" | "Other";

export interface MockCustomerAddress {
  id: string;
  label: MockAddressLabel;
  customLabel: string | null;
  recipientName: string;
  recipientPhoneNumber: string | null;
  organizationUnit: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  country: string;
  isDefaultShippingAddress: boolean;
  isDefaultBillingAddress: boolean;
}

export type MockAddressInput = Omit<
  MockCustomerAddress,
  "id" | "isDefaultShippingAddress" | "isDefaultBillingAddress"
> & {
  isDefaultShippingAddress?: boolean;
  isDefaultBillingAddress?: boolean;
};

const globalForAddresses = globalThis as unknown as { __vitalinkAddresses?: Map<string, MockCustomerAddress[]> };
const addressesByUserId = globalForAddresses.__vitalinkAddresses ?? new Map<string, MockCustomerAddress[]>();
globalForAddresses.__vitalinkAddresses = addressesByUserId;

/** Same reasoning as buyer-profile-store's seedDemoBuyerAddressOnce — the
 * seeded buyer@vitalink.dev demo account otherwise starts with an empty
 * address book, which makes checkout/settings look broken rather than
 * empty-by-design on first login. */
function seedDemoAddressOnce(): void {
  const demoUser = findMockUserByEmail("buyer@vitalink.dev");
  if (!demoUser || addressesByUserId.has(demoUser.userId)) {
    return;
  }
  addressesByUserId.set(demoUser.userId, [
    {
      id: randomUUID(),
      label: "Home",
      customLabel: null,
      recipientName: "Ada Buyer",
      recipientPhoneNumber: "+2348000000001",
      organizationUnit: null,
      addressLine1: "No 12 Nza Street",
      addressLine2: "Independence Layout",
      city: "Enugu",
      state: "Enugu",
      postalCode: null,
      country: "Nigeria",
      isDefaultShippingAddress: true,
      isDefaultBillingAddress: true,
    },
  ]);
}
seedDemoAddressOnce();

export function listMockAddresses(userId: string): MockCustomerAddress[] {
  return addressesByUserId.get(userId) ?? [];
}

export function getMockAddress(userId: string, addressId: string): MockCustomerAddress | null {
  return listMockAddresses(userId).find((a) => a.id === addressId) ?? null;
}

/** Mirrors AddCustomerAddress's own note: "The first address is
 * automatically set as the default shipping and billing address." */
export function addMockAddress(userId: string, input: MockAddressInput): MockCustomerAddress {
  const existing = addressesByUserId.get(userId) ?? [];
  const isFirst = existing.length === 0;
  const address: MockCustomerAddress = {
    ...input,
    id: randomUUID(),
    isDefaultShippingAddress: isFirst || (input.isDefaultShippingAddress ?? false),
    isDefaultBillingAddress: isFirst || (input.isDefaultBillingAddress ?? false),
  };
  if (address.isDefaultShippingAddress) {
    existing.forEach((a) => (a.isDefaultShippingAddress = false));
  }
  if (address.isDefaultBillingAddress) {
    existing.forEach((a) => (a.isDefaultBillingAddress = false));
  }
  const updated = [...existing, address];
  addressesByUserId.set(userId, updated);
  return address;
}

export function updateMockAddress(userId: string, addressId: string, input: MockAddressInput): MockCustomerAddress | null {
  const existing = addressesByUserId.get(userId) ?? [];
  const index = existing.findIndex((a) => a.id === addressId);
  if (index === -1) return null;

  if (input.isDefaultShippingAddress) {
    existing.forEach((a) => (a.isDefaultShippingAddress = false));
  }
  if (input.isDefaultBillingAddress) {
    existing.forEach((a) => (a.isDefaultBillingAddress = false));
  }
  const updated: MockCustomerAddress = {
    ...input,
    id: addressId,
    isDefaultShippingAddress: input.isDefaultShippingAddress ?? existing[index].isDefaultShippingAddress,
    isDefaultBillingAddress: input.isDefaultBillingAddress ?? existing[index].isDefaultBillingAddress,
  };
  existing[index] = updated;
  addressesByUserId.set(userId, existing);
  return updated;
}

/** Mirrors RemoveCustomerAddress's own note: "An address set as a default
 * cannot be removed." */
export function removeMockAddress(userId: string, addressId: string): { error?: string } {
  const existing = addressesByUserId.get(userId) ?? [];
  const address = existing.find((a) => a.id === addressId);
  if (!address) return { error: "Address not found." };
  if (address.isDefaultShippingAddress || address.isDefaultBillingAddress) {
    return { error: "A default address can't be removed — set another address as default first." };
  }
  addressesByUserId.set(userId, existing.filter((a) => a.id !== addressId));
  return {};
}

export function setMockDefaultAddress(
  userId: string,
  addressId: string,
  which: "shipping" | "billing",
): { error?: string } {
  const existing = addressesByUserId.get(userId) ?? [];
  const address = existing.find((a) => a.id === addressId);
  if (!address) return { error: "Address not found." };
  const field = which === "shipping" ? "isDefaultShippingAddress" : "isDefaultBillingAddress";
  existing.forEach((a) => (a[field] = a.id === addressId));
  addressesByUserId.set(userId, existing);
  return {};
}
