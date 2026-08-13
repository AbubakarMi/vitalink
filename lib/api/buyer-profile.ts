import "server-only";
import { ApiError } from "./client";
import { verifySession } from "@/lib/auth/dal";
import { getMockDeliveryAddress, setMockDeliveryAddress, type MockDeliveryAddress } from "./mocks/buyer-profile-store";

export type { MockDeliveryAddress as DeliveryAddress } from "./mocks/buyer-profile-store";

async function currentBuyerId(): Promise<string> {
  const session = await verifySession();
  if (!session) {
    throw new ApiError(401, "Not signed in.");
  }
  return session.userId;
}

export async function getDeliveryAddress(): Promise<MockDeliveryAddress | null> {
  const buyerId = await currentBuyerId();
  return getMockDeliveryAddress(buyerId);
}

export async function saveDeliveryAddress(address: MockDeliveryAddress): Promise<MockDeliveryAddress> {
  const buyerId = await currentBuyerId();
  return setMockDeliveryAddress(buyerId, address);
}
