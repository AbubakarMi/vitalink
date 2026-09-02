"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { startTotpEnrollment, confirmTotpEnrollment, removeTotp, logoutAllDevices } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { setTotpHint } from "@/lib/auth/totp-hint";

export interface ActionResult {
  error?: string;
}

export interface TotpEnrollmentView {
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
    revalidatePath("/vendor/settings");
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't confirm that code." };
  }
}

export async function removeTotpAction(): Promise<ActionResult> {
  try {
    await removeTotp();
    await setTotpHint(false);
    revalidatePath("/vendor/settings");
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
  redirect("/login");
}
