import { requireAccountType } from "@/lib/auth/dal";

export const instant = false; // reads cookies — genuinely dynamic

/**
 * Admin shell. AccountType==="Staff" check here is a UX convenience, not the
 * security boundary (design doc §2.2) — every admin page also calls
 * requireAccountType("admin", ...) directly. Per-resource permission checks
 * (Permissions.Vendors.List, etc.) happen inside each page via
 * lib/auth/permissions.ts's hasPermission(), not here — see design doc §5.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAccountType("admin", "/admin/dashboard");
  return <>{children}</>;
}
