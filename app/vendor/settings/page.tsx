import Link from "next/link";
import { Landmark } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { getTotpEnabled } from "@/lib/api/auth";
import { MfaSettings } from "@/components/vendor/mfa-settings";
import { LogoutAllDevicesButton } from "@/components/vendor/logout-all-devices-button";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** No mockup was supplied for a full Settings screen (design doc §1), but
 * payout/settlement-account management is real today at /vendor/payouts —
 * surfaced here rather than orphaned now that the sidebar drops its own nav
 * entry in favor of this page. */
export default async function VendorSettingsPage() {
  await requireAccountType("vendor", "/vendor/settings");
  const totpEnabled = await getTotpEnabled();
  return (
    <div className="mx-auto max-w-2xl py-16">
      <h1 className="text-2xl font-semibold text-ink">Settings</h1>
      <p className="mt-2 text-sm text-text-muted">More account settings are coming soon.</p>

      <Link
        href="/vendor/payouts"
        className="mt-8 flex items-center gap-4 rounded-2xl border border-line bg-white p-5 transition-colors hover:border-ink/40"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
          <Landmark className="size-5" aria-hidden />
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink">Payout settings</span>
          <span className="block text-sm text-text-muted">Manage your settlement bank accounts</span>
        </span>
      </Link>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <MfaSettings initialEnabled={totpEnabled} />
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <LogoutAllDevicesButton />
      </div>
    </div>
  );
}
