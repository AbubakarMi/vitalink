"use server";

import { revalidatePath } from "next/cache";
import {
  createVendorProductDraft,
  generateProductDetails,
  saveGeneratedDetails,
  publishVendorProduct,
  type CreateVendorProductDraftInput,
  type GeneratedProductDetails,
} from "@/lib/api/vendor-products";
import { ApiError } from "@/lib/api/client";

export interface ActionResult<T> {
  data?: T;
  error?: string;
}

export async function createDraftAction(input: CreateVendorProductDraftInput): Promise<ActionResult<{ productId: string }>> {
  try {
    const product = await createVendorProductDraft(input);
    return { data: { productId: product.id } };
  } catch (err) {
    return { error: err instanceof ApiError ? err.detail : "Couldn't save product details." };
  }
}

export async function generateDetailsAction(
  input: { name: string; brand: string; categorySlug: string; manufacturedIn: string },
  variant: number,
): Promise<ActionResult<GeneratedProductDetails>> {
  try {
    const details = await generateProductDetails(input, variant);
    return { data: details };
  } catch {
    return { error: "Couldn't generate product details — try again." };
  }
}

export async function saveDraftAction(
  productId: string,
  content: GeneratedProductDetails,
): Promise<ActionResult<{ productId: string }>> {
  try {
    await saveGeneratedDetails(productId, content);
    revalidatePath("/vendor/products");
    return { data: { productId } };
  } catch (err) {
    return { error: err instanceof ApiError ? err.detail : "Couldn't save draft." };
  }
}

export async function publishAction(
  productId: string,
  content: GeneratedProductDetails,
): Promise<ActionResult<{ productId: string }>> {
  try {
    await saveGeneratedDetails(productId, content);
    await publishVendorProduct(productId);
    revalidatePath("/vendor/products");
    revalidatePath("/vendor/dashboard");
    return { data: { productId } };
  } catch (err) {
    return { error: err instanceof ApiError ? err.detail : "Couldn't publish product." };
  }
}
