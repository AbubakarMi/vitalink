import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";
import { BadgeCheck, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/api/products";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Bolds and colors every case-insensitive occurrence of `query` in `text`
 * blue — the "why this matched" cue a real search results page gives you.
 * Reuses the app's existing blue accent (`#5c8aff`, the marketplace stock
 * badge) rather than introducing a new color. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(trimmed)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <strong key={i} className="font-bold text-[#5c8aff]">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * Search results — a ranked vertical list (Google's "many results, ranked,
 * click through to one" structure) restyled to this app's own card language
 * instead of Google's literal blue-link look, which read as out of place
 * here. Products arrive already ranked best-match-first
 * (lib/api/products.ts's searchRelevance); this just renders that order.
 */
export function SearchResultsList({ products, query }: { products: Product[]; query: string }) {
  return (
    <div className="space-y-3">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.slug}`}
          className="group flex gap-5 rounded-2xl border border-line bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-verified/30 hover:shadow-[0_8px_24px_rgba(0,39,8,0.08)] sm:p-5"
        >
          <span className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f4f4f2] sm:size-28">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt="" fill sizes="112px" className="object-contain p-2" />
            ) : (
              <span className="size-10 rounded-full bg-white" aria-hidden />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-mint px-2.5 py-1 text-[10px] font-medium text-verified">
                {product.categoryLabel ?? product.categorySlug}
              </span>
              {product.brand && <span className="text-xs text-text-muted">{product.brand}</span>}
              {product.badge && (
                <span className="flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-[10px] font-medium text-verified">
                  <BadgeCheck className="size-3" aria-hidden />
                  {product.badge}
                </span>
              )}
            </div>

            <p className="mt-1.5 line-clamp-1 text-lg leading-snug font-semibold text-ink transition-colors group-hover:text-verified">
              <Highlighted text={product.name} query={query} />
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
              <Highlighted text={product.shortDescription || "No description provided."} query={query} />
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-baseline gap-2 font-['Reddit_Sans',_sans-serif]">
                <span className="text-lg text-ink">N{product.price.toLocaleString("en-NG")}</span>
                {product.originalPrice && (
                  <span className="text-sm text-text-muted line-through">
                    N{product.originalPrice.toLocaleString("en-NG")}
                  </span>
                )}
              </span>
              {product.inStock === false ? (
                <span className="text-xs font-medium text-[#c0392b]">Out of stock</span>
              ) : product.stockCount !== undefined ? (
                <span className="text-xs text-text-muted">{product.stockCount} in stock</span>
              ) : null}
            </div>
          </div>

          <ChevronRight
            className="hidden size-5 shrink-0 self-center text-text-muted transition-colors group-hover:text-verified sm:block"
            aria-hidden
          />
        </Link>
      ))}
    </div>
  );
}
