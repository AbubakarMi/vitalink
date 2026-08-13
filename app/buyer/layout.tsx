import { requireAccountType } from "@/lib/auth/dal";
import { getCurrentUser } from "@/lib/api/auth";
import { DashboardShell } from "@/components/buyer/dashboard-shell";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/**
 * Buyer shell. The AccountType==="Customer" check here is a UX convenience
 * (avoids flashing the full buyer nav before redirecting); it is NOT the
 * security boundary — each page.tsx also calls requireAccountType("buyer",
 * ...) directly, since layouts don't reliably re-run on every client-side
 * navigation (design doc §2.2). Unlike vendor, there's no profile/
 * verification gate — a buyer account is usable immediately after signup.
 */
export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  await requireAccountType("buyer", "/buyer/dashboard");
  const user = await getCurrentUser();

  return <DashboardShell buyerName={user?.displayName ?? "Buyer"}>{children}</DashboardShell>;
}
