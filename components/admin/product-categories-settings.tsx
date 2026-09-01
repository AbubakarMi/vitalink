"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { AdminProductCategory } from "@/lib/api/admin/categories";
import { setCategoryActiveAction } from "@/app/admin/actions";

/** Configuration module's "Product Categories" screen — the taxonomy
 * products/vendors get assigned into. Backed by real backend endpoints
 * (Administration/ProductCategories/*), unlike onboarding-fields-settings.tsx.
 * The "add category" flow lives in add-category-modal.tsx, rendered by the
 * page itself at the top-right of the header — not in here. */
export function ProductCategoriesSettings({ categories }: { categories: AdminProductCategory[] }) {
  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-text-muted">
        No categories yet. Use &ldquo;Add category&rdquo; above to create the first one.
      </div>
    );
  }

  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-white">
      {categories.map((category) => (
        <CategoryRow key={category.id} category={category} />
      ))}
    </div>
  );
}

function CategoryRow({ category }: { category: AdminProductCategory }) {
  const [isActive, setIsActive] = useState(category.isActive);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !isActive;
    setIsActive(next);
    setError(null);
    startTransition(async () => {
      const result = await setCategoryActiveAction(category.id, next);
      if (result.error) {
        setError(result.error);
        setIsActive(category.isActive);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{category.name}</p>
        <p className="mt-1 text-xs text-text-muted">/{category.slug}</p>
        {category.description && <p className="mt-1 text-sm text-text-muted">{category.description}</p>}
        {error && <p className="mt-1 text-xs text-[#c0392b]">{error}</p>}
      </div>
      <label className={cn("flex shrink-0 items-center gap-2.5", "cursor-pointer")}>
        <span className="text-xs font-medium text-ink-soft">{isActive ? "Active" : "Inactive"}</span>
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          aria-label={`${category.name} active`}
          disabled={pending}
          onClick={toggle}
          className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", isActive ? "bg-ink" : "bg-line")}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
              isActive && "translate-x-5",
            )}
          />
        </button>
      </label>
    </div>
  );
}
