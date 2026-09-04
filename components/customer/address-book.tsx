"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Country } from "country-state-city";
import { MapPin, Phone, Plus, Pencil, Trash2, Truck, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountrySelectField, StateSelectField } from "@/components/ui/country-state-fields";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { ADDRESS_LABELS, type AddressLabel } from "@/lib/api/address-labels";
import type { CustomerAddress } from "@/lib/api/addresses";
import {
  addAddressAction,
  updateAddressAction,
  removeAddressAction,
  setDefaultShippingAddressAction,
  setDefaultBillingAddressAction,
  type AddressActionResult,
} from "@/app/customer/settings/actions";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]";

function resolveCountryCode(countryName: string | undefined): string {
  if (!countryName) return "NG";
  return Country.getAllCountries().find((c) => c.name === countryName)?.isoCode ?? "NG";
}

function addressLabel(address: CustomerAddress): string {
  return address.label === "Other" && address.customLabel ? address.customLabel : address.label;
}

/**
 * A customer's saved address book — replaces the old single free-text
 * "delivery address" (components/customer/delivery-address-form.tsx, now
 * unused) now that lib/api/addresses.ts backs the real multi-address model
 * (Home/Office/Department/Other, each independently defaultable for
 * shipping and billing — see vitalink-backend's CustomerAddress). Used on
 * Settings for management, and will back checkout's address picker once
 * that's wired to real order placement (see
 * docs/BACKEND_INTEGRATION_GUIDE.md §0d).
 */
export function AddressBook({ initialAddresses }: { initialAddresses: CustomerAddress[] }) {
  type Mode = { type: "list" } | { type: "add" } | { type: "edit"; address: CustomerAddress };
  const [mode, setMode] = useState<Mode>({ type: "list" });
  const [pending, startTransition] = useTransition();
  const [defaultError, setDefaultError] = useState<string | null>(null);

  function makeDefault(addressId: string, which: "shipping" | "billing") {
    setDefaultError(null);
    startTransition(async () => {
      const action = which === "shipping" ? setDefaultShippingAddressAction : setDefaultBillingAddressAction;
      const result = await action(addressId);
      if (result.error) setDefaultError(result.error);
    });
  }

  if (mode.type === "add") {
    return <AddressForm onDone={() => setMode({ type: "list" })} />;
  }
  if (mode.type === "edit") {
    return <AddressForm initial={mode.address} onDone={() => setMode({ type: "list" })} />;
  }

  return (
    <div>
      {initialAddresses.length === 0 ? (
        <p className="text-sm text-text-muted">No saved addresses yet.</p>
      ) : (
        <div className="space-y-3">
          {defaultError && <p className="text-sm text-[#c0392b]">{defaultError}</p>}
          {initialAddresses.map((address) => (
            <div key={address.id} className="rounded-xl border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-mint px-2.5 py-0.5 text-xs font-medium text-ink">
                      {addressLabel(address)}
                    </span>
                    {address.isDefaultShippingAddress && (
                      <span className="flex items-center gap-1 text-xs text-verified">
                        <Truck className="size-3" aria-hidden />
                        Default shipping
                      </span>
                    )}
                    {address.isDefaultBillingAddress && (
                      <span className="flex items-center gap-1 text-xs text-verified">
                        <Receipt className="size-3" aria-hidden />
                        Default billing
                      </span>
                    )}
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-ink">
                    <MapPin className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                    {address.recipientName}
                  </p>
                  {address.recipientPhoneNumber && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
                      <Phone className="size-3 shrink-0" aria-hidden />
                      {address.recipientPhoneNumber}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-ink-soft">
                    {address.organizationUnit && `${address.organizationUnit}, `}
                    {address.addressLine1}
                    {address.addressLine2 && `, ${address.addressLine2}`}, {address.city}, {address.state}
                    {address.postalCode && ` ${address.postalCode}`}, {address.country}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMode({ type: "edit", address })}
                    aria-label="Edit address"
                    className="flex size-8 items-center justify-center rounded-full text-text-muted hover:bg-mint hover:text-ink"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <ConfirmActionButton
                    title="Remove this address?"
                    description="This can't be undone. A default shipping or billing address can't be removed — set another address as default first."
                    confirmLabel="Yes, remove it"
                    onConfirm={() => removeAddressAction(address.id)}
                    trigger={
                      <button
                        type="button"
                        aria-label="Remove address"
                        className="flex size-8 items-center justify-center rounded-full text-text-muted hover:bg-[#fff0ee] hover:text-[#c0392b]"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    }
                  />
                </div>
              </div>

              {(!address.isDefaultShippingAddress || !address.isDefaultBillingAddress) && (
                <div className="mt-3 flex flex-wrap gap-3 border-t border-line pt-3 text-xs">
                  {!address.isDefaultShippingAddress && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => makeDefault(address.id, "shipping")}
                      className="font-medium text-verified hover:text-ink disabled:opacity-50"
                    >
                      Make default shipping
                    </button>
                  )}
                  {!address.isDefaultBillingAddress && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => makeDefault(address.id, "billing")}
                      className="font-medium text-verified hover:text-ink disabled:opacity-50"
                    >
                      Make default billing
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setMode({ type: "add" })}
        className="mt-4 flex items-center gap-1.5 text-sm font-medium text-verified hover:text-ink"
      >
        <Plus className="size-4" aria-hidden />
        Add a new address
      </button>
    </div>
  );
}

const initialFormState: AddressActionResult = {};

function AddressForm({ initial, onDone }: { initial?: CustomerAddress; onDone: () => void }) {
  const isEdit = Boolean(initial);
  const action = isEdit ? updateAddressAction : addAddressAction;
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [label, setLabel] = useState<AddressLabel>(initial?.label ?? "Home");
  const [countryCode, setCountryCode] = useState(() => resolveCountryCode(initial?.country ?? "Nigeria"));

  // Success — hand control back to the list, which re-reads fresh addresses
  // from the server (revalidatePath in the action already triggered that).
  // An effect, not a plain render-time call, since onDone() sets state on
  // the *parent* AddressBook — doing that mid-render (rather than after
  // commit) is what React's own rules of hooks warn against.
  useEffect(() => {
    if (state.data) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.data]);

  return (
    <form action={formAction} className="space-y-4">
      {isEdit && <input type="hidden" name="addressId" value={initial!.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="label" className="text-sm font-medium text-ink-soft">
            Label
          </label>
          <select
            id="label"
            name="label"
            value={label}
            onChange={(e) => setLabel(e.target.value as AddressLabel)}
            className={fieldClass}
          >
            {ADDRESS_LABELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        {label === "Other" && (
          <div>
            <label htmlFor="customLabel" className="text-sm font-medium text-ink-soft">
              Custom label
            </label>
            <input
              id="customLabel"
              name="customLabel"
              placeholder="e.g. Warehouse"
              defaultValue={initial?.customLabel ?? ""}
              required
              className={fieldClass}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="recipientName" className="text-sm font-medium text-ink-soft">
            Recipient name
          </label>
          <input
            id="recipientName"
            name="recipientName"
            defaultValue={initial?.recipientName}
            required
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="recipientPhoneNumber" className="text-sm font-medium text-ink-soft">
            Recipient phone (optional)
          </label>
          <input
            id="recipientPhoneNumber"
            name="recipientPhoneNumber"
            placeholder="+234…"
            defaultValue={initial?.recipientPhoneNumber ?? ""}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="organizationUnit" className="text-sm font-medium text-ink-soft">
          Department / unit (optional)
        </label>
        <input
          id="organizationUnit"
          name="organizationUnit"
          placeholder="e.g. Procurement Office"
          defaultValue={initial?.organizationUnit ?? ""}
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CountrySelectField name="country" defaultCountryCode={countryCode} required onCountryChange={(iso) => setCountryCode(iso)} />
        <StateSelectField name="state" countryCode={countryCode} defaultValue={initial?.state} required />
        <div>
          <label htmlFor="city" className="text-sm font-medium text-ink-soft">
            City
          </label>
          <input id="city" name="city" defaultValue={initial?.city} required className={fieldClass} />
        </div>
        <div>
          <label htmlFor="postalCode" className="text-sm font-medium text-ink-soft">
            Postal code (optional)
          </label>
          <input id="postalCode" name="postalCode" defaultValue={initial?.postalCode ?? ""} className={fieldClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="addressLine1" className="text-sm font-medium text-ink-soft">
            Address line 1
          </label>
          <input id="addressLine1" name="addressLine1" defaultValue={initial?.addressLine1} required className={fieldClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="addressLine2" className="text-sm font-medium text-ink-soft">
            Address line 2 (optional)
          </label>
          <input id="addressLine2" name="addressLine2" defaultValue={initial?.addressLine2 ?? ""} className={fieldClass} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-ink-soft">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isDefaultShippingAddress"
            defaultChecked={initial?.isDefaultShippingAddress}
            className="size-4 rounded border-line"
          />
          Default shipping address
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isDefaultBillingAddress"
            defaultChecked={initial?.isDefaultBillingAddress}
            className="size-4 rounded border-line"
          />
          Default billing address
        </label>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85",
            pending && "opacity-60",
          )}
        >
          {pending ? "Saving…" : isEdit ? "Save changes" : "Save address"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink-soft hover:bg-cream"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
