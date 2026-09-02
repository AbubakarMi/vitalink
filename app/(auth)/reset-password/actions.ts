"use server";

import { redirect } from "next/navigation";
import { resetPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export interface ResetPasswordState {
  error?: string;
}

export async function resetPasswordAction(_prevState: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const userId = String(formData.get("userId") ?? "");
  const code = String(formData.get("code") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!userId || !code) {
    return { error: "This reset link is missing information — request a new one." };
  }
  if (password.length < 8) {
    return { error: "Choose a password with at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  try {
    await resetPassword(userId, code, password);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 400)) {
      return { error: "That reset link is invalid or has expired — request a new one." };
    }
    return { error: "Something went wrong resetting your password. Please try again." };
  }

  redirect("/login?reset=success");
}
