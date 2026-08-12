"use server";

import { revalidatePath } from "next/cache";
import { updateVendorProductStatus, restockVendorProduct } from "@/lib/api/vendor-products";

export async function archiveProductAction(productId: string) {
  await updateVendorProductStatus(productId, "Archived");
  revalidatePath("/vendor/products");
  revalidatePath("/vendor/dashboard");
}

export async function restockProductAction(productId: string, addedUnits: number) {
  await restockVendorProduct(productId, addedUnits);
  revalidatePath("/vendor/products");
  revalidatePath(`/vendor/products/${productId}`);
  revalidatePath("/vendor/dashboard");
}
