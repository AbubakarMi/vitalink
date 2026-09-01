import Link from "next/link";
import { Tags } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { listOnboardingFields } from "@/lib/api/admin/onboarding-fields";
import { OnboardingFieldsSettings } from "@/components/admin/onboarding-fields-settings";
import { AddOnboardingFieldModal } from "@/components/admin/add-onboarding-field-modal";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** First page under the "Configuration" module — what the vendor onboarding
 * wizard asks for. See app/admin/settings/categories/page.tsx for the other
 * Configuration screen (product categories). */
export default async function AdminSettingsPage() {
  await requireAccountType("admin", "/admin/settings");
  const fields = await listOnboardingFields();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-verified uppercase">Configuration</p>
          <h1 className="mt-1 font-[family-name:var(--font-newsreader)] text-3xl text-ink">Onboarding Fields</h1>
        </div>
        <AddOnboardingFieldModal />
      </div>
      <p className="mt-2 max-w-xl text-sm text-text-muted">
        Choose what the vendor onboarding wizard asks for — text fields, numbers, or document uploads — whether each
        is required or optional, and the description a vendor sees for it.
      </p>

      <Link
        href="/admin/settings/categories"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-verified hover:underline"
      >
        <Tags className="size-4" aria-hidden />
        Configure product categories instead →
      </Link>

      <div className="mt-6">
        <OnboardingFieldsSettings fields={fields} />
      </div>
    </div>
  );
}
