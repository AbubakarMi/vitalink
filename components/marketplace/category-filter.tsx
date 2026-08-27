import Link from "next/link";

export const CATEGORY_OPTIONS: { label: string; slug?: string }[] = [
  { label: "All categories" },
  { label: "Medical Equipment", slug: "medical-equipment" },
  { label: "Scientific Equipment", slug: "scientific-tools" },
  { label: "Reagents & Culture Media", slug: "reagents-culture-media" },
  { label: "Lab Equipments", slug: "lab-equipment" },
];

/** Sidebar category list — real navigation via ?categorySlug= against
 * lib/api/products.ts. No client state needed, just links. */
export function CategoryFilter({ activeCategorySlug, search }: { activeCategorySlug?: string; search: string }) {
  function hrefFor(slug?: string): string {
    const params = new URLSearchParams(search);
    if (slug) {
      params.set("categorySlug", slug);
    } else {
      params.delete("categorySlug");
    }
    params.delete("page");
    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  }

  return (
    <div>
      <h3 className="text-xs font-semibold tracking-wide text-ink uppercase">Category</h3>
      <nav className="mt-3 space-y-0.5">
        {CATEGORY_OPTIONS.map((option) => {
          const isActive = activeCategorySlug === option.slug;
          return (
            <Link
              key={option.label}
              href={hrefFor(option.slug)}
              className={`block rounded-lg px-2.5 py-1.5 text-sm ${
                isActive ? "bg-mint font-medium text-verified" : "text-ink-soft hover:bg-surface-muted"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
