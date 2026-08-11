"use server";

import { redirect } from "next/navigation";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { verifySession } from "@/lib/auth/dal";
import { dashboardPathForAccountType } from "@/lib/auth/route-groups";

export interface LoginState {
  error?: string;
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

  if (response.mfaRequired) {
    // The TOTP/OTP-email verification step isn't built yet — this is honest
    // about that rather than silently failing or pretending the login
    // completed. See lib/api/auth.ts's loginTotp/loginVerifyOtpEmail for the
    // already-wired backend calls this will bind to once that UI exists.
    return { error: "This account requires two-factor verification, which isn't available in this preview yet." };
  }

  // login() already relayed the backend's Set-Cookie onto this response
  // (lib/api/auth.ts). verifySession() reads the now-set cookie to route to
  // the right dashboard — the login response itself carries no accountType.
  const session = await verifySession();
  redirect(session ? dashboardPathForAccountType(session.accountType) : "/");
}
