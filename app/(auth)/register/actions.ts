"use server";

import { register, checkEmailAvailability, AccountTypeSchema } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

/** `available: null` means the check couldn't be done at all (bad input, a
 * network hiccup — see lib/api/auth.ts's checkEmailAvailability comment) —
 * register-form.tsx treats that as "say nothing" rather than a wrong tick
 * either way. */
export async function checkEmailAvailabilityAction(email: string): Promise<{ available: boolean | null }> {
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes("@")) {
    return { available: null };
  }
  const available = await checkEmailAvailability(trimmed);
  return { available };
}

export interface RegisterState {
  error?: string;
  success?: { userId: string; email: string; verificationEmailSent: boolean };
}

const REGISTRABLE_ACCOUNT_TYPES = ["Customer", "Vendor"] as const;

export async function registerAction(_prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = formData.get("confirmPassword");
  const accountTypeRaw = String(formData.get("accountType") ?? "");

  if (!firstName || !lastName || !email || !password) {
    return { error: "Fill in your name, email, and password." };
  }

  if (confirmPassword !== null && password !== String(confirmPassword)) {
    return { error: "Passwords don't match." };
  }

  const accountTypeParsed = AccountTypeSchema.safeParse(accountTypeRaw);
  if (!accountTypeParsed.success || !REGISTRABLE_ACCOUNT_TYPES.includes(accountTypeParsed.data as "Customer" | "Vendor")) {
    return { error: "Choose whether you're buying or selling." };
  }

  try {
    const response = await register({
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      password,
      accountType: accountTypeParsed.data,
    });
    return { success: { userId: response.userId, email, verificationEmailSent: response.verificationEmailSent } };
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      return { error: "An account with that email already exists." };
    }
    if (error instanceof ApiError && error.status === 400) {
      return { error: "Check your details — something didn't pass validation." };
    }
    return { error: "Something went wrong creating your account. Please try again." };
  }
}
