"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  publishVendorProduct,
  regenerateProductDetails,
  deleteVendorProduct,
  restockVendorProduct,
  updateVendorProductStatus,
} from "@/lib/api/vendor-products";

export async function publishProductAction(productId: string) {
  await publishVendorProduct(productId);
  revalidatePath(`/vendor/products/${productId}`);
  revalidatePath("/vendor/products");
  revalidatePath("/vendor/dashboard");
}

export async function regenerateProductAction(productId: string) {
  await regenerateProductDetails(productId);
  revalidatePath(`/vendor/products/${productId}`);
}

export async function deleteProductAction(productId: string) {
  await deleteVendorProduct(productId);
  revalidatePath("/vendor/products");
  redirect("/vendor/products");
}

export async function restockProductAction(productId: string, formData: FormData) {
  const addedUnits = Number(formData.get("addedUnits")) || 0;
  await restockVendorProduct(productId, addedUnits);
  revalidatePath(`/vendor/products/${productId}`);
  revalidatePath("/vendor/products");
  revalidatePath("/vendor/dashboard");
}

export async function archiveProductAction(productId: string) {
  await updateVendorProductStatus(productId, "Archived");
  revalidatePath(`/vendor/products/${productId}`);
  revalidatePath("/vendor/products");
}
