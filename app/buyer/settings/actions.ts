"use server";

import { revalidatePath } from "next/cache";
import { saveDeliveryAddress } from "@/lib/api/buyer-profile";
import { ApiError } from "@/lib/api/client";

export interface ActionResult {
  error?: string;
}

export async function saveDeliveryAddressAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await saveDeliveryAddress({
      country: String(formData.get("country") ?? ""),
      state: String(formData.get("state") ?? ""),
      city: String(formData.get("city") ?? ""),
      addressLine: String(formData.get("addressLine") ?? ""),
    });
    revalidatePath("/buyer/settings");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't save your address." };
  }
}
