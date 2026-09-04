"use client";

import { LogOut } from "lucide-react";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { logoutAllDevicesAction } from "@/app/customer/settings/actions";

/** Terminates every session for this account, this device included — the
 * action itself redirects to /login on success (see actions.ts), so there's
 * no local "done" state to render here. */
export function LogoutAllDevicesButton() {
  return (
    <div>
      <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">Sessions</p>
      <p className="mt-1 mb-4 text-sm text-text-muted">
        Signed in somewhere you don&apos;t recognize? Sign out of every device at once, including this one.
      </p>
      <ConfirmActionButton
        onConfirm={logoutAllDevicesAction}
        title="Sign out of all devices?"
        description="This ends every active session for your account, including the one you're using right now — you'll need to log in again."
        confirmLabel="Yes, sign out everywhere"
        trigger={
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-[#c0392b]/30 px-4 py-2.5 text-sm font-medium text-[#c0392b] transition-colors hover:border-[#c0392b] hover:bg-[#fff0ee]"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out of all devices
          </button>
        }
      />
    </div>
  );
}
