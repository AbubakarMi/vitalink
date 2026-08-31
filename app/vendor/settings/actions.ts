"use server";

import { revalidatePath } from "next/cache";
import { setMfaPreference, type MfaMethod } from "@/lib/api/security";
import { ApiError } from "@/lib/api/client";

export interface ActionResult {
  error?: string;
}

export async function setMfaPreferenceAction(method: MfaMethod): Promise<ActionResult> {
  try {
    await setMfaPreference(method);
    revalidatePath("/vendor/settings");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't save your security preference." };
  }
}
