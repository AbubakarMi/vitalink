"use server";

import { revalidatePath } from "next/cache";
import { updateVendorProductDraft, type UpdateVendorProductInput } from "@/lib/api/vendor-products";
import { ApiError } from "@/lib/api/client";

export interface ActionResult {
  error?: string;
}

export async function updateProductAction(productId: string, input: UpdateVendorProductInput): Promise<ActionResult> {
  try {
    await updateVendorProductDraft(productId, input);
    revalidatePath(`/vendor/products/${productId}`);
    revalidatePath("/vendor/products");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.detail : "Couldn't save changes." };
  }
}
