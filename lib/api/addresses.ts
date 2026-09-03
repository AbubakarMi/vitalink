import "server-only";
import { z } from "zod";
import { apiClient, ApiError } from "./client";
import { verifySession } from "@/lib/auth/dal";
import { ADDRESS_LABELS, type AddressLabel } from "./address-labels";
import {
  listMockAddresses,
  addMockAddress,
  updateMockAddress,
  removeMockAddress,
  setMockDefaultAddress,
  type MockAddressInput,
} from "./mocks/address-store";

// Re-exported so existing callers of this module keep working — see
// address-labels.ts's own comment for why the values live there instead.
export { ADDRESS_LABELS, type AddressLabel };

/**
 * Customer address book — real endpoints confirmed from source
 * (vitalink-backend Web.Api/Endpoints/Customer/*, Application/Features/
 * Customer/{Queries,Commands}/*CustomerAddress*). A buyer can save several
 * labeled addresses and mark one as the default shipping and/or billing
 * address — this is the actual prerequisite for real order placement
 * (Carts/Commands/PlaceOrder needs ShippingAddressId/BillingAddressId, not
 * a free-text address), though PlaceOrder itself stays out of scope for
 * this pass — see docs/BACKEND_INTEGRATION_GUIDE.md §0d.
 *
 * CUSTOMER_ADDRESS_DATA_SOURCE flips every function below between that live
 * backend and an in-memory mock (lib/api/mocks/address-store.ts), same seam
 * as VENDOR_PROFILE_DATA_SOURCE/PRODUCTS_DATA_SOURCE/AUTH_DATA_SOURCE. This
 * supersedes lib/api/buyer-profile.ts's single-address
 * getDeliveryAddress/saveDeliveryAddress, which only ever modeled one flat
 * address with no label/recipient/default concept at all.
 */
const SOURCE = process.env.CUSTOMER_ADDRESS_DATA_SOURCE ?? "mock";

// See lib/api/auth.ts's identical ALLOW_MOCK_IN_PRODUCTION guard/comment.
const ALLOW_MOCK_IN_PRODUCTION = process.env.ALLOW_MOCK_IN_PRODUCTION === "true";

if (SOURCE === "mock" && process.env.NODE_ENV === "production" && !ALLOW_MOCK_IN_PRODUCTION) {
  throw new Error(
    "CUSTOMER_ADDRESS_DATA_SOURCE is still 'mock' in a production build. This fails the " +
      "build on purpose, mirroring AUTH_DATA_SOURCE's guard in lib/api/auth.ts. Set " +
      "CUSTOMER_ADDRESS_DATA_SOURCE=live once the real backend is reachable, or set " +
      "ALLOW_MOCK_IN_PRODUCTION=true for a throwaway demo deploy. See docs/MOCK_AUTH.md.",
  );
}

async function currentUserId(): Promise<string> {
  const session = await verifySession();
  if (!session) {
    throw new ApiError(401, "Not signed in.");
  }
  return session.userId;
}

const BASE = "/users/customers/addresses";

const AddressSchema = z.object({
  id: z.string(),
  label: z.enum(ADDRESS_LABELS),
  customLabel: z.string().nullable(),
  recipientName: z.string(),
  recipientPhoneNumber: z.string().nullable(),
  organizationUnit: z.string().nullable(),
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string().nullable(),
  country: z.string(),
  isDefaultShippingAddress: z.boolean(),
  isDefaultBillingAddress: z.boolean(),
});
export type CustomerAddress = z.infer<typeof AddressSchema>;

export interface AddressInput {
  label: AddressLabel;
  /** Required when label is "Other" — CustomerAddress.Create's own rule
   * (CustomerErrors.CustomLabelRequired), enforced server-side either way. */
  customLabel?: string | null;
  recipientName: string;
  recipientPhoneNumber?: string | null;
  organizationUnit?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode?: string | null;
  country: string;
  isDefaultShippingAddress?: boolean;
  isDefaultBillingAddress?: boolean;
}

function toMockInput(input: AddressInput): MockAddressInput {
  return {
    label: input.label,
    customLabel: input.customLabel ?? null,
    recipientName: input.recipientName,
    recipientPhoneNumber: input.recipientPhoneNumber ?? null,
    organizationUnit: input.organizationUnit ?? null,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2 ?? null,
    city: input.city,
    state: input.state,
    postalCode: input.postalCode ?? null,
    country: input.country,
    isDefaultShippingAddress: input.isDefaultShippingAddress,
    isDefaultBillingAddress: input.isDefaultBillingAddress,
  };
}

export async function listAddresses(): Promise<CustomerAddress[]> {
  if (SOURCE === "mock") {
    const userId = await currentUserId();
    return z.array(AddressSchema).parse(listMockAddresses(userId));
  }
  const { data } = await apiClient.get<{ addresses: unknown }>(BASE);
  return z.array(AddressSchema).parse(data.addresses);
}

export async function addAddress(input: AddressInput): Promise<CustomerAddress> {
  if (SOURCE === "mock") {
    const userId = await currentUserId();
    return AddressSchema.parse(addMockAddress(userId, toMockInput(input)));
  }
  const { data } = await apiClient.post<unknown>(BASE, { body: input });
  return AddressSchema.parse(data);
}

export async function updateAddress(addressId: string, input: AddressInput): Promise<CustomerAddress> {
  if (SOURCE === "mock") {
    const userId = await currentUserId();
    const updated = updateMockAddress(userId, addressId, toMockInput(input));
    if (!updated) throw new ApiError(404, "Address not found.");
    return AddressSchema.parse(updated);
  }
  const { data } = await apiClient.put<unknown>(`${BASE}/${addressId}`, { body: input });
  return AddressSchema.parse(data);
}

export async function removeAddress(addressId: string): Promise<{ error?: string }> {
  if (SOURCE === "mock") {
    const userId = await currentUserId();
    return removeMockAddress(userId, addressId);
  }
  try {
    await apiClient.delete(`${BASE}/${addressId}`);
    return {};
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    return { error: "Something went wrong removing that address." };
  }
}

export async function setDefaultAddress(addressId: string, which: "shipping" | "billing"): Promise<{ error?: string }> {
  if (SOURCE === "mock") {
    const userId = await currentUserId();
    return setMockDefaultAddress(userId, addressId, which);
  }
  try {
    const path = which === "shipping" ? "default-shipping" : "default-billing";
    await apiClient.put(`${BASE}/${addressId}/${path}`);
    return {};
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    return { error: "Something went wrong updating your default address." };
  }
}
