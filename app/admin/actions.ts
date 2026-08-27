"use server";

import { revalidatePath } from "next/cache";
import { requireAccountType } from "@/lib/auth/dal";
import { hasPermission } from "@/lib/auth/permissions";
import { approveVendor, rejectVendor, markVendorUnderReview } from "@/lib/api/admin/vendors";
import { approveAdminProduct, rejectAdminProduct } from "@/lib/api/admin/products";
import { createStaff, approveStaff, suspendStaff, type CreateStaffInput } from "@/lib/api/admin/staff";
import { processBulkTransfer } from "@/lib/api/admin/settlements";
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

export async function approveVendorAction(vendorId: string): Promise<ActionResult> {
  try {
    await requireAdminPermission("Vendors", "Approve");
    await approveVendor(vendorId);
    revalidatePath("/admin/vendors");
    revalidatePath(`/admin/vendors/${vendorId}`);
    revalidatePath("/admin/dashboard");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't approve this vendor." };
  }
}

export async function rejectVendorAction(vendorId: string, reason: string): Promise<ActionResult> {
  try {
    await requireAdminPermission("Vendors", "Reject");
    await rejectVendor(vendorId, reason);
    revalidatePath("/admin/vendors");
    revalidatePath(`/admin/vendors/${vendorId}`);
    revalidatePath("/admin/dashboard");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't decline this vendor." };
  }
}

export async function markVendorUnderReviewAction(vendorId: string): Promise<ActionResult> {
  try {
    await requireAdminPermission("Vendors", "Approve");
    await markVendorUnderReview(vendorId);
    revalidatePath("/admin/vendors");
    revalidatePath(`/admin/vendors/${vendorId}`);
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't update this vendor." };
  }
}

export async function approveProductAction(productId: string): Promise<ActionResult> {
  try {
    await requireAdminPermission("Products", "Approve");
    await approveAdminProduct(productId);
    revalidatePath("/admin/inventory");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't approve this product." };
  }
}

export async function rejectProductAction(productId: string, reason: string): Promise<ActionResult> {
  try {
    await requireAdminPermission("Products", "Reject");
    await rejectAdminProduct(productId, reason);
    revalidatePath("/admin/inventory");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't reject this product." };
  }
}

export async function createStaffAction(input: CreateStaffInput): Promise<ActionResult> {
  try {
    await requireAdminPermission("Staff", "Create");
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
    await requireAdminPermission("Staff", "Create");
    await approveStaff(staffId);
    revalidatePath("/admin/users");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't approve this staff account." };
  }
}

export async function suspendStaffAction(staffId: string): Promise<ActionResult> {
  try {
    await requireAdminPermission("Staff", "Create");
    await suspendStaff(staffId);
    revalidatePath("/admin/users");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't suspend this staff account." };
  }
}

export async function processBulkTransferAction(vendorIds: string[]): Promise<ActionResult & { transferred?: number; total?: number }> {
  try {
    await requireAdminPermission("Vendors", "Approve");
    const result = await processBulkTransfer(vendorIds);
    revalidatePath("/admin/settlements");
    revalidatePath("/admin/transactions");
    return result;
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't process the bulk transfer." };
  }
}
