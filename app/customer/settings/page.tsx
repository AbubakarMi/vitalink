import { requireAccountType } from "@/lib/auth/dal";
import { getCurrentUser, getTotpEnabled } from "@/lib/api/auth";
import { listAddresses } from "@/lib/api/addresses";
import { AddressBook } from "@/components/customer/address-book";
import { MfaSettings } from "@/components/customer/mfa-settings";
import { LogoutAllDevicesButton } from "@/components/customer/logout-all-devices-button";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

function splitName(displayName: string): { first: string; last: string } {
  const [first, ...rest] = displayName.trim().split(/\s+/);
  return { first: first ?? "", last: rest.join(" ") };
}

/** Matches Desktop - 70.pdf's Basic Info + Delivery Address layout. Basic
 * info (name/email/phone) is read-only here — there's no update-profile
 * endpoint or mock function anywhere in lib/api/auth.ts to back editing it
 * yet. Address book (lib/api/addresses.ts) replaced the old single free-text
 * delivery address — a customer can save several labeled addresses and mark
 * defaults for shipping/billing, matching the real backend's model. */
export default async function CustomerSettingsPage() {
  await requireAccountType("customer", "/customer/settings");
  const [user, addresses, totpEnabled] = await Promise.all([getCurrentUser(), listAddresses(), getTotpEnabled()]);
  const { first, last } = splitName(user?.displayName ?? "");

  return (
    <div className="mx-auto max-w-2xl">
      <p className="font-mono text-xs tracking-[0.2em] text-verified uppercase">Account</p>
      <h1 className="mt-1 font-[family-name:var(--font-newsreader)] text-3xl text-ink">Settings</h1>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-ink text-xl font-semibold text-white">
            {(first || "?").charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="font-semibold text-ink">{user?.displayName}</p>
            <p className="text-sm text-text-muted">Customer</p>
          </div>
        </div>

        <p className="mt-6 font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">Basic Info</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnlyField label="First Name" value={first} />
          <ReadOnlyField label="Last Name" value={last} />
          <ReadOnlyField label="Email" value={user?.email ?? ""} />
          <ReadOnlyField label="Phone" value={user?.phone ?? "Not set"} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">Delivery Addresses</p>
        <p className="mt-1 mb-4 text-sm text-text-muted">Your default shipping/billing address is used to prefill checkout.</p>
        <AddressBook initialAddresses={addresses} />
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <MfaSettings initialEnabled={totpEnabled} />
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <LogoutAllDevicesButton />
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-sm text-ink">{value || "—"}</p>
    </div>
  );
}
