"use server";

import { revalidatePath } from "next/cache";
import { requireAccountType } from "@/lib/auth/dal";
import { hasPermission } from "@/lib/auth/permissions";
import { approveVendor, rejectVendor, markVendorUnderReview } from "@/lib/api/admin/vendors";
import { approveAdminProduct, rejectAdminProduct } from "@/lib/api/admin/products";
import { createStaff, approveStaff, suspendStaff, type CreateStaffInput } from "@/lib/api/admin/staff";
import { processBulkTransfer } from "@/lib/api/admin/settlements";
import {
  updateOnboardingField,
  createOnboardingField,
  deleteOnboardingField,
  type CreateOnboardingFieldInput,
} from "@/lib/api/admin/onboarding-fields";
import {
  createAdminProductCategory,
  setAdminProductCategoryActive,
  type CreateAdminProductCategoryInput,
} from "@/lib/api/admin/categories";
import { ApiError } from "@/lib/api/client";

export interface ActionResult {
  error?: string;
}

async function requireAdminPermission(resource: string, action: string) {
  const session = await requireAccountType("admin", "/admin/dashboard");
  if (!hasPermission(session, resource, action)) {
    throw new ApiError(403, "You don't have permission to do this.");
  }
}

// revalidatePath("/admin", "layout") on every action below that can move a
// vendor/product in or out of "Pending" — app/admin/layout.tsx fetches the
// Approval sidebar badge's pending counts once per layout render, and a
// plain revalidatePath("/admin/vendors") only revalidates that page segment,
// not the shared layout wrapping it, so the badge would otherwise go stale
// until the next full navigation.

export async function approveVendorAction(vendorId: string): Promise<ActionResult> {
  try {
    await requireAdminPermission("Vendors", "Manage");
    await approveVendor(vendorId);
    revalidatePath("/admin/vendors");
    revalidatePath(`/admin/vendors/${vendorId}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin", "layout");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't approve this vendor." };
  }
}

export async function rejectVendorAction(vendorId: string, reason: string): Promise<ActionResult> {
  try {
    await requireAdminPermission("Vendors", "Manage");
    await rejectVendor(vendorId, reason);
    revalidatePath("/admin/vendors");
    revalidatePath(`/admin/vendors/${vendorId}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin", "layout");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't decline this vendor." };
  }
}

export async function markVendorUnderReviewAction(vendorId: string): Promise<ActionResult> {
  try {
    await requireAdminPermission("Vendors", "Manage");
    await markVendorUnderReview(vendorId);
    revalidatePath("/admin/vendors");
    revalidatePath(`/admin/vendors/${vendorId}`);
    revalidatePath("/admin", "layout");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't update this vendor." };
  }
}

export async function approveProductAction(productId: string): Promise<ActionResult> {
  try {
    await requireAdminPermission("Products", "Manage");
    await approveAdminProduct(productId);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin", "layout");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't approve this product." };
  }
}

export async function rejectProductAction(productId: string, reason: string): Promise<ActionResult> {
  try {
    await requireAdminPermission("Products", "Manage");
    await rejectAdminProduct(productId, reason);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin", "layout");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't reject this product." };
  }
}

export async function createStaffAction(input: CreateStaffInput): Promise<ActionResult> {
  try {
    await requireAdminPermission("Staff", "Manage");
    await createStaff(input);
    revalidatePath("/admin/users");
    revalidatePath("/admin/dashboard");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't send that invite." };
  }
}

export async function approveStaffAction(staffId: string): Promise<ActionResult> {
  try {
    await requireAdminPermission("Staff", "Manage");
    await approveStaff(staffId);
    revalidatePath("/admin/users");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't approve this staff account." };
  }
}

export async function suspendStaffAction(staffId: string): Promise<ActionResult> {
  try {
    await requireAdminPermission("Staff", "Manage");
    await suspendStaff(staffId);
    revalidatePath("/admin/users");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't suspend this staff account." };
  }
}

export async function processBulkTransferAction(vendorIds: string[]): Promise<ActionResult & { transferred?: number; total?: number }> {
  try {
    await requireAdminPermission("Vendors", "Manage");
    const result = await processBulkTransfer(vendorIds);
    revalidatePath("/admin/settlements");
    revalidatePath("/admin/transactions");
    return result;
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't process the bulk transfer." };
  }
}

// No requireAdminPermission() on any of these three, on purpose: "Settings"
// isn't a real backend resource (Shared/Identity/ResourceConstants.cs has no
// such entry) — this whole feature is frontend-owned config with no backend
// endpoint at all (see lib/api/admin/onboarding-fields.ts), so there's no
// real permission to check against. Gating on account type alone is the
// honest version of this check.

export async function updateOnboardingFieldAction(
  key: string,
  patch: { required?: boolean; enabled?: boolean },
): Promise<ActionResult> {
  try {
    await requireAccountType("admin", "/admin/dashboard");
    await updateOnboardingField(key, patch);
    revalidatePath("/admin/settings");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't update that field." };
  }
}

export async function createOnboardingFieldAction(input: CreateOnboardingFieldInput): Promise<ActionResult> {
  try {
    await requireAccountType("admin", "/admin/dashboard");
    if (!input.label.trim()) {
      return { error: "Give the field a label." };
    }
    await createOnboardingField(input);
    revalidatePath("/admin/settings");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't add that field." };
  }
}

export async function deleteOnboardingFieldAction(key: string): Promise<ActionResult> {
  try {
    await requireAccountType("admin", "/admin/dashboard");
    await deleteOnboardingField(key);
    revalidatePath("/admin/settings");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't remove that field." };
  }
}

export async function createCategoryAction(input: CreateAdminProductCategoryInput): Promise<ActionResult> {
  try {
    await requireAdminPermission("ProductCategories", "Manage");
    if (!input.name.trim()) {
      return { error: "Give the category a name." };
    }
    await createAdminProductCategory(input);
    revalidatePath("/admin/settings/categories");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't add that category." };
  }
}

export async function setCategoryActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    await requireAdminPermission("ProductCategories", "Manage");
    await setAdminProductCategoryActive(id, isActive);
    revalidatePath("/admin/settings/categories");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't update that category." };
  }
}
