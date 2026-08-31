import { requireAccountType } from "@/lib/auth/dal";
import { listDocumentRequirements } from "@/lib/api/admin/document-requirements";
import { DocumentRequirementsSettings } from "@/components/admin/document-requirements-settings";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Platform settings — currently just vendor onboarding's document
 * requirements config (super admin/*.pdf's sidebar has a Settings item, but
 * the backend doesn't define a broader set of platform settings yet). */
export default async function AdminSettingsPage() {
  await requireAccountType("admin", "/admin/settings");
  const requirements = await listDocumentRequirements();

  return (
    <div className="mx-auto max-w-3xl">
      <p className="font-mono text-xs tracking-[0.2em] text-verified uppercase">Platform</p>
      <h1 className="mt-1 font-[family-name:var(--font-newsreader)] text-3xl text-ink">Settings</h1>
      <p className="mt-2 max-w-xl text-sm text-text-muted">
        Choose which documents the vendor onboarding wizard asks for, and whether each is required or optional.
      </p>

      <div className="mt-6">
        <DocumentRequirementsSettings requirements={requirements} />
      </div>
    </div>
  );
}
