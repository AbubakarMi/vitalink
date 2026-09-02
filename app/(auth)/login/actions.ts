"use server";

import { redirect } from "next/navigation";
import { login, loginTotp, loginStartOtpEmail, loginVerifyOtpEmail, resendLoginOtpEmail } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { verifySession } from "@/lib/auth/dal";
import { dashboardPathForAccountType } from "@/lib/auth/route-groups";
import { MARKETPLACE_LIVE } from "@/lib/api/marketplace";
import { claimGuestCartOnLoginAction } from "@/lib/cart/live-actions";

export interface LoginState {
  error?: string;
  /** Set instead of erroring when login() reports mfaRequired — login-form.tsx
   * switches to MfaChallengeForm rather than dead-ending. */
  mfa?: { flowId: string; availableMethods: string[] };
}

async function redirectToDashboard(): Promise<never> {
  // Merge any guest cart into the now-authenticated session before routing
  // away — only meaningful once the real backend cart is in play.
  if (MARKETPLACE_LIVE) {
    await claimGuestCartOnLoginAction();
  }
  const session = await verifySession();
  return redirect(session ? dashboardPathForAccountType(session.accountType) : "/");
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const loginName = String(formData.get("loginName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!loginName || !password) {
    return { error: "Enter your email and password." };
  }

  let response;
  try {
    response = await login({ loginName, password });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 400)) {
      return { error: "Incorrect email or password." };
    }
    return { error: "Something went wrong signing you in. Please try again." };
  }

  if (response.mfaRequired && response.flowId) {
    return { mfa: { flowId: response.flowId, availableMethods: response.availableMethods } };
  }

  // login() already relayed the backend's Set-Cookie onto this response
  // (lib/api/auth.ts). verifySession() reads the now-set cookie to route to
  // the right dashboard — the login response itself carries no accountType.
  return redirectToDashboard();
}

export interface MfaChallengeState {
  error?: string;
}

export async function loginTotpAction(_prevState: MfaChallengeState, formData: FormData): Promise<MfaChallengeState> {
  const flowId = String(formData.get("flowId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  if (!code) {
    return { error: "Enter the 6-digit code from your authenticator app." };
  }
  try {
    await loginTotp(flowId, code);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 400)) {
      return { error: "That code didn't match. Check your authenticator app and try again." };
    }
    return { error: "Something went wrong verifying that code. Please try again." };
  }
  return redirectToDashboard();
}

export async function loginOtpEmailStartAction(flowId: string): Promise<{ maskedEmail?: string; error?: string }> {
  try {
    const result = await loginStartOtpEmail(flowId);
    return { maskedEmail: result.maskedEmail };
  } catch {
    return { error: "Couldn't send a code to your email. Please try again." };
  }
}

export async function loginOtpEmailResendAction(flowId: string): Promise<{ error?: string }> {
  try {
    await resendLoginOtpEmail(flowId);
    return {};
  } catch {
    return { error: "Couldn't resend the code. Please try again." };
  }
}

export async function loginOtpEmailVerifyAction(_prevState: MfaChallengeState, formData: FormData): Promise<MfaChallengeState> {
  const flowId = String(formData.get("flowId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  if (!code) {
    return { error: "Enter the code sent to your email." };
  }
  try {
    await loginVerifyOtpEmail(flowId, code);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 400)) {
      return { error: "That code didn't match. Try again." };
    }
    return { error: "Something went wrong verifying that code. Please try again." };
  }
  return redirectToDashboard();
}
