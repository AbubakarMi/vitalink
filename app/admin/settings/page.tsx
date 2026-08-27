import { Settings as SettingsIcon } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { ComingSoon } from "@/components/admin/coming-soon";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** No admin settings API yet — the sidebar (super admin/Super Admin
 * Dashboard.pdf) has a Settings item, but nothing in the backend defines
 * what platform settings a Staff user can change. Placeholder — UI comes later. */
export default async function AdminSettingsPage() {
  await requireAccountType("admin", "/admin/settings");
  return (
    <ComingSoon
      icon={SettingsIcon}
      title="Settings"
      description="Platform settings will show here once there's a backend endpoint defining what's configurable."
    />
  );
}
