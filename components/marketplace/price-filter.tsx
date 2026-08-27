"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Sidebar price range filter — a dual-thumb slider (bounded by the real
 * catalog min/max, app/globals.css's .price-slider rules) plus the two
 * numeric fields underneath it, matching the reference screenshot's price
 * panel. The parent (product-sidebar-filters.tsx) keys this by the active
 * min/max so a URL-driven change (browser back, another filter's Apply)
 * remounts with fresh state instead of syncing local state from props via
 * an effect. */
export function PriceFilter({
  bounds,
  activeMinPrice,
  activeMaxPrice,
}: {
  bounds: { min: number; max: number };
  activeMinPrice?: string;
  activeMaxPrice?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [min, setMin] = useState(activeMinPrice ? Number(activeMinPrice) : bounds.min);
  const [max, setMax] = useState(activeMaxPrice ? Number(activeMaxPrice) : bounds.max);
  const step = Math.max(1, Math.round((bounds.max - bounds.min) / 200));

  function setMinClamped(value: number) {
    setMin(Math.min(value, max));
  }

  function setMaxClamped(value: number) {
    setMax(Math.max(value, min));
  }

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    if (min > bounds.min) {
      params.set("minPrice", String(min));
    } else {
      params.delete("minPrice");
    }
    if (max < bounds.max) {
      params.set("maxPrice", String(max));
    } else {
      params.delete("maxPrice");
    }
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  const minPercent = ((min - bounds.min) / (bounds.max - bounds.min)) * 100;
  const maxPercent = ((max - bounds.min) / (bounds.max - bounds.min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wide text-ink uppercase">Price (N)</h3>
        <button type="button" onClick={apply} className="text-xs font-medium text-verified hover:underline">
          Apply
        </button>
      </div>

      <div className="price-slider relative mt-4 h-4">
        <div className="absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-verified"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={min}
          onChange={(e) => setMinClamped(Number(e.target.value))}
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={max}
          onChange={(e) => setMaxClamped(Number(e.target.value))}
          aria-label="Maximum price"
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="number"
          min={bounds.min}
          max={max}
          inputMode="numeric"
          value={min}
          onChange={(e) => setMinClamped(Number(e.target.value) || bounds.min)}
          aria-label="Minimum price (N)"
          className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink-soft outline-none focus:border-verified"
        />
        <span className="text-text-muted">-</span>
        <input
          type="number"
          min={min}
          max={bounds.max}
          inputMode="numeric"
          value={max}
          onChange={(e) => setMaxClamped(Number(e.target.value) || bounds.max)}
          aria-label="Maximum price (N)"
          className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink-soft outline-none focus:border-verified"
        />
      </div>
    </div>
  );
}
