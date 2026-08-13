"use client";

import { useActionState } from "react";
import type { DeliveryAddress } from "@/lib/api/buyer-profile";
import { saveDeliveryAddressAction, type ActionResult } from "@/app/buyer/settings/actions";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]";

const initialState: ActionResult = {};

export function DeliveryAddressForm({ initialAddress }: { initialAddress: DeliveryAddress | null }) {
  const [state, formAction, pending] = useActionState(saveDeliveryAddressAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="country" className="text-sm font-medium text-ink-soft">
            Country
          </label>
          <input
            id="country"
            name="country"
            placeholder="e.g. Nigeria"
            defaultValue={initialAddress?.country ?? "Nigeria"}
            required
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="state" className="text-sm font-medium text-ink-soft">
            State
          </label>
          <input id="state" name="state" placeholder="e.g. Enugu" defaultValue={initialAddress?.state} required className={fieldClass} />
        </div>
        <div>
          <label htmlFor="city" className="text-sm font-medium text-ink-soft">
            City
          </label>
          <input id="city" name="city" placeholder="e.g. Enugu" defaultValue={initialAddress?.city} required className={fieldClass} />
        </div>
        <div>
          <label htmlFor="addressLine" className="text-sm font-medium text-ink-soft">
            Street Address
          </label>
          <input
            id="addressLine"
            name="addressLine"
            placeholder="e.g. No 12 Nza Street, Independence Layout"
            defaultValue={initialAddress?.addressLine}
            required
            className={fieldClass}
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save Address"}
      </button>
    </form>
  );
}
