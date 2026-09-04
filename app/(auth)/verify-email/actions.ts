"use server";

import { resendVerificationEmail } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export interface ResendResult {
  error?: string;
  sent?: boolean;
}

export async function resendVerificationEmailAction(userId: string): Promise<ResendResult> {
  try {
    await resendVerificationEmail(userId);
    return { sent: true };
  } catch (err) {
    return { error: err instanceof ApiError ? err.detail : "Couldn't resend the verification email." };
  }
}
