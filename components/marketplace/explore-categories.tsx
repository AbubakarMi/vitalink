import Link from "next/link";

const CATEGORIES = [
  { label: "Medical Equipment", slug: "medical-equipment" },
  { label: "Scientific Tools", slug: "scientific-tools" },
  { label: "Reagents & Culture Media", slug: "reagents-culture-media" },
  { label: "Lab Equipments", slug: "lab-equipment" },
];

/**
 * Replaces the old "Recently Viewed / Recommended" Jumbotron — an empty
 * pale-green banner with no products or real content under it (no
 * view-history or recommendation system exists to back it). This is real,
 * functional navigation instead of a decorative label with nothing behind it.
 */
export function ExploreCategories({ activeCategorySlug }: { activeCategorySlug?: string }) {
  return (
    <div className="mx-auto max-w-6xl rounded-[10px] border border-line bg-white px-10 py-8">
      <p className="font-mono text-xs tracking-[0.2em] text-verified uppercase">Browse by category</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {CATEGORIES.map((category) => (
          <Link
            key={category.slug}
            href={`/products?categorySlug=${category.slug}`}
            className={
              activeCategorySlug === category.slug
                ? "rounded-full bg-ink px-5 py-2.5 font-mono text-xs text-white"
                : "rounded-full border border-line px-5 py-2.5 font-mono text-xs text-ink-soft transition-colors hover:border-verified hover:text-verified"
            }
          >
            {category.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
