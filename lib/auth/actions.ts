"use server";

import { redirect } from "next/navigation";
import { logout } from "@/lib/api/auth";

/** Shared by every role's header account menu (components/ui/account-menu.tsx) —
 * logout() itself is already role-agnostic (clears the session cookie
 * regardless of AccountType), so this doesn't need a per-role variant. */
export async function logoutAction() {
  await logout();
  redirect("/login");
}
