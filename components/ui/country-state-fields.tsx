"use client";

import { useId, useMemo } from "react";
import { Country, State } from "country-state-city";
import { ChevronDown } from "lucide-react";

const ALL_COUNTRIES = Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name));

/** Nigeria first — this is a Nigeria-based marketplace and the overwhelming
 * majority of orders ship there, so it shouldn't be buried alphabetically
 * under every other country. */
const SORTED_COUNTRIES = [
  ...ALL_COUNTRIES.filter((c) => c.isoCode === "NG"),
  ...ALL_COUNTRIES.filter((c) => c.isoCode !== "NG"),
];

const selectClass =
  "mt-1.5 w-full appearance-none rounded-xl border border-line bg-white px-4 py-3 pr-9 text-sm text-ink shadow-sm outline-none focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)] disabled:cursor-not-allowed disabled:bg-cream disabled:text-text-muted";

/**
 * Real country list (country-state-city, 250 countries — not a hand-typed
 * one) for the checkout address form. Submits the country's display NAME
 * as the form field's value (matching DeliveryAddress.country: string,
 * which already just stores "Nigeria" as free text) — onCountryChange
 * separately reports the ISO code so the sibling StateSelectField can look
 * up that country's states.
 */
export function CountrySelectField({
  name,
  label = "Country",
  defaultCountryCode = "NG",
  required,
  onCountryChange,
}: {
  name: string;
  label?: string;
  defaultCountryCode?: string;
  required?: boolean;
  onCountryChange?: (isoCode: string, name: string) => void;
}) {
  const fieldId = useId();
  const defaultCountry = SORTED_COUNTRIES.find((c) => c.isoCode === defaultCountryCode);

  return (
    <div>
      <label htmlFor={fieldId} className="text-sm font-medium text-ink-soft">
        {label}
      </label>
      <div className="relative">
        <select
          id={fieldId}
          name={name}
          defaultValue={defaultCountry?.name ?? ""}
          required={required}
          onChange={(e) => {
            const country = SORTED_COUNTRIES.find((c) => c.name === e.target.value);
            onCountryChange?.(country?.isoCode ?? "", e.target.value);
          }}
          className={selectClass}
        >
          {!defaultCountry && <option value="" disabled>Select a country…</option>}
          {SORTED_COUNTRIES.map((country) => (
            <option key={country.isoCode} value={country.name}>
              {country.flag} {country.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
      </div>
    </div>
  );
}

/**
 * States/provinces for whichever country is currently selected in the
 * sibling CountrySelectField (countryCode prop, an ISO2 the parent tracks —
 * see components/customer/checkout-view.tsx). Re-mounts (key={countryCode})
 * whenever the country changes so a stale selection from the previous
 * country can't linger as this field's uncontrolled defaultValue. Some
 * countries have no state/province subdivisions in the library's data at
 * all, so the field disables itself with an honest placeholder rather than
 * showing an empty, unusable dropdown.
 */
export function StateSelectField({
  name,
  label = "State",
  countryCode,
  defaultValue,
  required,
}: {
  name: string;
  label?: string;
  countryCode: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const fieldId = useId();
  const states = useMemo(() => (countryCode ? State.getStatesOfCountry(countryCode) : []), [countryCode]);
  const hasStates = states.length > 0;

  return (
    <div>
      <label htmlFor={fieldId} className="text-sm font-medium text-ink-soft">
        {label}
      </label>
      <div className="relative">
        <select
          key={countryCode}
          id={fieldId}
          name={name}
          defaultValue={defaultValue ?? ""}
          required={required && hasStates}
          disabled={!hasStates}
          className={selectClass}
        >
          <option value="">{hasStates ? "Select a state…" : "No states listed for this country"}</option>
          {states.map((state) => (
            <option key={state.isoCode} value={state.name}>
              {state.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
      </div>
    </div>
  );
}
