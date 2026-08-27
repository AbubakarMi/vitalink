import { Scale } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { ComingSoon } from "@/components/admin/coming-soon";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Mocked — no backend concept of disputes yet (design doc §1). Placeholder — UI comes later. */
export default async function AdminDisputesPage() {
  await requireAccountType("admin", "/admin/disputes");
  return (
    <ComingSoon
      icon={Scale}
      title="Disputes"
      description="There's no backend concept of disputes yet — this will list buyer/vendor disputes once that exists."
    />
  );
}
