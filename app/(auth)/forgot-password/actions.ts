"use server";

import { forgotPassword } from "@/lib/api/auth";

export interface ForgotPasswordState {
  error?: string;
  sent?: boolean;
}

/** Always resolves to `sent: true` on a well-formed email — the backend
 * itself always returns 204 regardless of whether the address is registered
 * ("to avoid revealing whether the email is registered"), so surfacing a
 * distinct failure state here would leak exactly what that's meant to hide. */
export async function forgotPasswordAction(_prevState: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Enter your email address." };
  }
  try {
    await forgotPassword(email);
  } catch {
    // Swallowed on purpose — see the function comment above.
  }
  return { sent: true };
}
