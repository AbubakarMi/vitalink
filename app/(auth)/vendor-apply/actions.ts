"use server";

import {
  createVendorProfile,
  beginDocumentUpload,
  completeDocumentUpload,
  addSettlementAccount,
  type DocumentType,
} from "@/lib/api/vendor-profile";
import { register, login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { verifySession } from "@/lib/auth/dal";

export interface ActionResult {
  error?: string;
}

export interface IdentityState {
  error?: string;
  success?: boolean;
}

/**
 * Step 1 of the vendor onboarding wizard. Registers the account and signs it
 * in immediately (register() alone doesn't set cookies — only login() does),
 * so steps 2-4 in the same wizard session can call createVendorProfile/
 * beginDocumentUpload/addSettlementAccount right away instead of sending the
 * vendor to /login first — see vendor-apply-wizard.tsx.
 */
export async function identityAction(_prevState: IdentityState, formData: FormData): Promise<IdentityState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!firstName || !lastName || !email || !password) {
    return { error: "Fill in your name, email, and password." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  // The wizard's Previous button (vendor-apply-wizard.tsx) can bring someone
  // back to this step after it already succeeded once — re-submitting with
  // the same email they just registered would otherwise 409. Already signed
  // in as that email means this step is done; just continue instead of
  // erroring on a resubmit that changed nothing.
  const existingSession = await verifySession();
  if (existingSession && existingSession.email.toLowerCase() === email.toLowerCase()) {
    return { success: true };
  }

  try {
    await register({ firstName, lastName, email, password, accountType: "Vendor" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      return { error: "An account with that email already exists." };
    }
    if (error instanceof ApiError && error.status === 400) {
      return { error: "Check your details — something didn't pass validation." };
    }
    return { error: "Something went wrong creating your account. Please try again." };
  }

  try {
    const loginResponse = await login({ loginName: email, password });
    if (loginResponse.mfaRequired) {
      // Honest rather than silently stuck: the TOTP/OTP-email continuation UI
      // isn't built yet (see lib/api/auth.ts's loginTotp/loginVerifyOtpEmail).
      return {
        error:
          "Your account was created, but this session needs extra verification that isn't available in this flow yet. Please continue from the login page.",
      };
    }
  } catch {
    return {
      error: "Your account was created, but signing you in automatically failed. Please continue from the login page.",
    };
  }

  return { success: true };
}

export async function saveBusinessProfileAction(formData: FormData): Promise<ActionResult> {
  const vendorTypeInput = String(formData.get("vendorType") ?? "");
  const businessLegalName = String(formData.get("businessLegalName") ?? "").trim();
  const taxId = String(formData.get("taxId") ?? "").trim();
  const addressLine = String(formData.get("addressLine") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();

  // The design's "Manufacturer / Distributor/Supplier" choice maps onto two
  // of the backend's five VendorType values — "Supplier" isn't a distinct
  // backend value, so it collapses onto "Distributor" (the closest real
  // match: providing goods without manufacturing them).
  const vendorType = vendorTypeInput === "Manufacturer" ? "Manufacturer" : "Distributor";

  if (!businessLegalName || !addressLine || !city || !state) {
    return { error: "Fill in your legal entity name and headquarters address." };
  }

  try {
    await createVendorProfile({
      businessLegalName,
      vendorType,
      taxId: taxId || undefined,
      businessAddress: { addressLine, city, state, country: "Nigeria", postalCode: postalCode || undefined },
    });
    return {};
  } catch {
    return { error: "Something went wrong saving your business profile. Please try again." };
  }
}

export interface BeginUploadResult {
  documentId?: string;
  uploadUrl?: string;
  error?: string;
}

export async function beginUploadAction(
  documentType: DocumentType,
  documentName: string,
  fileName: string,
  contentType: string,
): Promise<BeginUploadResult> {
  try {
    const { uploads } = await beginDocumentUpload([{ documentName, documentType, fileName, contentType }]);
    const upload = uploads[0];
    if (!upload) {
      return { error: "The server didn't return an upload target. Please try again." };
    }
    return { documentId: upload.documentId, uploadUrl: upload.uploadUrl };
  } catch {
    return { error: "Couldn't start the upload. Please try again." };
  }
}

export async function finalizeUploadAction(documentId: string): Promise<ActionResult> {
  try {
    await completeDocumentUpload([documentId]);
    return {};
  } catch {
    return { error: "The file uploaded but couldn't be confirmed. Please try again." };
  }
}

export async function savePayoutAction(formData: FormData): Promise<ActionResult> {
  const bankName = String(formData.get("bankName") ?? "").trim();
  const bankCode = String(formData.get("bankCode") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  const accountName = String(formData.get("accountName") ?? "").trim();

  if (!bankName || !bankCode || !accountNumber || !accountName) {
    return { error: "Fill in your bank, account number, and account holder name." };
  }

  try {
    await addSettlementAccount({ accountName, accountNumber, bankName, bankCode, currency: "NGN" });
    return {};
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      return { error: "Check your account details — something didn't pass validation." };
    }
    return { error: "Something went wrong saving your payout details. Please try again." };
  }
}
