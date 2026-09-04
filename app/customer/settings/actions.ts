"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import {
  addAddress,
  updateAddress,
  removeAddress,
  setDefaultAddress,
  type AddressInput,
  type CustomerAddress,
} from "@/lib/api/addresses";
import { ADDRESS_LABELS, type AddressLabel } from "@/lib/api/address-labels";
import { startTotpEnrollment, confirmTotpEnrollment, removeTotp, logoutAllDevices } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export interface ActionResult {
  error?: string;
}

export interface TotpEnrollmentView {
  /** data:image/png;base64,… — rendered client-side, no QR library shipped
   * to the browser (see startTotpEnrollmentAction). */
  qrCodeDataUrl: string;
  secret: string;
}

export async function startTotpEnrollmentAction(): Promise<ActionResult & { data?: TotpEnrollmentView }> {
  try {
    const enrollment = await startTotpEnrollment();
    const qrCodeDataUrl = await QRCode.toDataURL(enrollment.uri, { width: 220, margin: 1 });
    return { data: { qrCodeDataUrl, secret: enrollment.secret } };
  } catch (err) {
    return { error: err instanceof ApiError ? err.detail : "Couldn't start authenticator setup." };
  }
}

export async function confirmTotpEnrollmentAction(code: string): Promise<ActionResult> {
  try {
    await confirmTotpEnrollment(code);
    revalidatePath("/customer/settings");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.detail : "Couldn't confirm that code." };
  }
}

export async function removeTotpAction(): Promise<ActionResult> {
  try {
    await removeTotp();
    revalidatePath("/customer/settings");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.detail : "Couldn't remove the authenticator app." };
  }
}

export async function logoutAllDevicesAction(): Promise<ActionResult> {
  try {
    await logoutAllDevices();
  } catch (err) {
    return { error: err instanceof ApiError ? err.detail : "Couldn't sign out of other devices." };
  }
  // Outside the try/catch — redirect() throws internally and must not be
  // caught by the block above (same gotcha as every other Server Action
  // redirect in this app).
  redirect("/login");
}

function addressInputFromFormData(formData: FormData): AddressInput {
  const label = String(formData.get("label") ?? "Home") as AddressLabel;
  return {
    label: ADDRESS_LABELS.includes(label) ? label : "Home",
    customLabel: formData.get("customLabel") ? String(formData.get("customLabel")) : null,
    recipientName: String(formData.get("recipientName") ?? ""),
    recipientPhoneNumber: formData.get("recipientPhoneNumber") ? String(formData.get("recipientPhoneNumber")) : null,
    organizationUnit: formData.get("organizationUnit") ? String(formData.get("organizationUnit")) : null,
    addressLine1: String(formData.get("addressLine1") ?? ""),
    addressLine2: formData.get("addressLine2") ? String(formData.get("addressLine2")) : null,
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    postalCode: formData.get("postalCode") ? String(formData.get("postalCode")) : null,
    country: String(formData.get("country") ?? ""),
    isDefaultShippingAddress: formData.get("isDefaultShippingAddress") === "on",
    isDefaultBillingAddress: formData.get("isDefaultBillingAddress") === "on",
  };
}

export interface AddressActionResult extends ActionResult {
  data?: CustomerAddress;
}

export async function addAddressAction(_prev: AddressActionResult, formData: FormData): Promise<AddressActionResult> {
  try {
    const address = await addAddress(addressInputFromFormData(formData));
    revalidatePath("/customer/settings");
    return { data: address };
  } catch (err) {
    return { error: err instanceof ApiError ? err.detail : "Couldn't save that address." };
  }
}

export async function updateAddressAction(_prev: AddressActionResult, formData: FormData): Promise<AddressActionResult> {
  const addressId = String(formData.get("addressId") ?? "");
  try {
    const address = await updateAddress(addressId, addressInputFromFormData(formData));
    revalidatePath("/customer/settings");
    return { data: address };
  } catch (err) {
    return { error: err instanceof ApiError ? err.detail : "Couldn't save that address." };
  }
}

export async function removeAddressAction(addressId: string): Promise<ActionResult> {
  const result = await removeAddress(addressId);
  revalidatePath("/customer/settings");
  return result;
}

export async function setDefaultShippingAddressAction(addressId: string): Promise<ActionResult> {
  const result = await setDefaultAddress(addressId, "shipping");
  revalidatePath("/customer/settings");
  return result;
}

export async function setDefaultBillingAddressAction(addressId: string): Promise<ActionResult> {
  const result = await setDefaultAddress(addressId, "billing");
  revalidatePath("/customer/settings");
  return result;
}
