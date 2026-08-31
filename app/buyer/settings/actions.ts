"use server";

import { revalidatePath } from "next/cache";
import { saveDeliveryAddress } from "@/lib/api/buyer-profile";
import { setMfaPreference, type MfaMethod } from "@/lib/api/security";
import { ApiError } from "@/lib/api/client";

export interface ActionResult {
  error?: string;
}

export async function setMfaPreferenceAction(method: MfaMethod): Promise<ActionResult> {
  try {
    await setMfaPreference(method);
    revalidatePath("/buyer/settings");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't save your security preference." };
  }
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
