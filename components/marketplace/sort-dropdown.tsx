"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS, type SortOption } from "@/lib/api/product-sort";

/** Real sort — navigates via ?sort= against lib/api/products.ts's mock sort logic. */
export function SortDropdown({ activeSort }: { activeSort?: SortOption }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div className="relative flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-3 text-xs font-medium text-ink-soft">
      <span className="pointer-events-none tracking-wide uppercase">Sort by</span>
      <select
        value={activeSort ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Sort by"
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value="">Default</option>
        {Object.entries(SORT_OPTIONS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <Image src="/marketplace/sort-chevron.svg" alt="" width={16} height={16} aria-hidden />
    </div>
  );
}
