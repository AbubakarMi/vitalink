"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Sidebar brand checkbox list — batches checkbox toggles into one ?brand=
 * navigation on Apply rather than reloading on every click. The parent
 * (product-sidebar-filters.tsx) keys this by activeBrands.join(",") so a
 * URL-driven change (Clear, browser back) remounts with fresh state instead
 * of syncing local state from props via an effect. */
export function BrandFilter({ brands, activeBrands }: { brands: string[]; activeBrands: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<string[]>(activeBrands);

  function toggle(brand: string) {
    setPending((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]));
  }

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    if (pending.length > 0) {
      params.set("brand", pending.join(","));
    } else {
      params.delete("brand");
    }
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  function clear() {
    setPending([]);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("brand");
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  const dirty = pending.slice().sort().join(",") !== activeBrands.slice().sort().join(",");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wide text-ink uppercase">Brand</h3>
        {activeBrands.length > 0 && (
          <button type="button" onClick={clear} className="text-xs font-medium text-text-muted hover:text-ink">
            Clear
          </button>
        )}
      </div>
      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
        {brands.map((brand) => (
          <label key={brand} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={pending.includes(brand)}
              onChange={() => toggle(brand)}
              className="size-4 shrink-0 rounded border-line accent-verified"
            />
            {brand}
          </label>
        ))}
      </div>
      {dirty && (
        <button
          type="button"
          onClick={apply}
          className="mt-3 w-full rounded-lg bg-verified px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-verified-hover"
        >
          Apply
        </button>
      )}
    </div>
  );
}
