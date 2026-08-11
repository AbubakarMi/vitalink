"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/api/products";

type TabKey = "specs" | "accessories" | "clinical";

const TABS: { key: TabKey; label: string }[] = [
  { key: "specs", label: "Technical Specs" },
  { key: "accessories", label: "Included Accessories" },
  { key: "clinical", label: "Clinical Use Cases" },
];

/** Figma EZER-KEY node 1591:3628 "More Information Container". Falls back to
 * a plain message when a product (most of the generated mock catalog) has no
 * detail-page content, instead of rendering an empty tab. */
export function ProductDetailTabs({ product }: { product: Product }) {
  const [active, setActive] = useState<TabKey>("specs");

  return (
    <div className="rounded-2xl bg-white p-10">
      <div className="flex gap-8 border-b border-[#e1e3e4] pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`relative pb-3 text-sm ${active === tab.key ? "text-[#4a7a4a]" : "text-[#c1c8c4]"}`}
          >
            {tab.label}
            {active === tab.key && (
              <span className="absolute -bottom-[13px] left-0 h-1 w-full rounded-[1px] bg-[#1a4d3e]" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        {active === "specs" &&
          (product.technicalSpecs && product.technicalSpecs.length > 0 ? (
            product.technicalSpecs.map((spec) => (
              <div key={spec.label}>
                <p className="text-[10px] font-medium text-[#64748b]">{spec.label}</p>
                <p className="mt-1 text-sm font-medium text-[#0a2e1f]">{spec.value}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-text-muted">{product.shortDescription}</p>
          ))}

        {active === "accessories" &&
          (product.includedAccessories && product.includedAccessories.length > 0 ? (
            <ul className="list-disc space-y-2 pl-5 text-sm text-[#0a2e1f]">
              {product.includedAccessories.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">Accessory details for this product aren&apos;t listed yet.</p>
          ))}

        {active === "clinical" &&
          (product.clinicalUseCases && product.clinicalUseCases.length > 0 ? (
            <ul className="list-disc space-y-2 pl-5 text-sm text-[#0a2e1f]">
              {product.clinicalUseCases.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">Clinical use case details for this product aren&apos;t listed yet.</p>
          ))}
      </div>

      <div className="mt-10 text-center">
        <Link href="/products" className="text-[16px] text-[#44474d]">
          Explore
        </Link>
      </div>
    </div>
  );
}
