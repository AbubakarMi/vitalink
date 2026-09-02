"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { saveDeliveryAddress } from "@/lib/api/buyer-profile";
import { startTotpEnrollment, confirmTotpEnrollment, removeTotp, logoutAllDevices } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { setTotpHint } from "@/lib/auth/totp-hint";

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
    return { error: err instanceof ApiError ? err.message : "Couldn't start authenticator setup." };
  }
}

export async function confirmTotpEnrollmentAction(code: string): Promise<ActionResult> {
  try {
    await confirmTotpEnrollment(code);
    await setTotpHint(true);
    revalidatePath("/buyer/settings");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't confirm that code." };
  }
}

export async function removeTotpAction(): Promise<ActionResult> {
  try {
    await removeTotp();
    await setTotpHint(false);
    revalidatePath("/buyer/settings");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't remove the authenticator app." };
  }
}

export async function logoutAllDevicesAction(): Promise<ActionResult> {
  try {
    await logoutAllDevices();
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't sign out of other devices." };
  }
  // Outside the try/catch — redirect() throws internally and must not be
  // caught by the block above (same gotcha as every other Server Action
  // redirect in this app).
  redirect("/login");
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
