import Image from "next/image";
import Link from "next/link";

/**
 * Figma EZER-KEY node 1340:956/958 shows fabricated placeholder scale
 * ("Showing 100 of 22,500 results", 6 pages) — that's Figma demo data, not
 * real. This renders the actual mock catalog's page slice/count and real
 * Prev/page-number/Next links built from listProductsPaged() (design doc §1's
 * no-fabrication principle, same as the landing page's social-proof numbers).
 */
export function Pagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  searchParams,
  basePath = "/products",
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
  /** Defaults to /products; the dedicated /search results page (Google-style,
   * search-bar.tsx) passes "/search" to keep its own pagination on itself. */
  basePath?: string;
}) {
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  function hrefFor(targetPage: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && key !== "page") params.set(key, value);
    }
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1,
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white px-8 py-5">
      <p className="text-xs text-ink-soft">
        Showing <span className="font-semibold text-ink">{rangeStart}-{rangeEnd}</span> of{" "}
        <span className="font-semibold text-ink">{totalCount}</span> results
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="flex items-center gap-1 rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink-soft hover:border-ink"
          >
            <Image src="/marketplace/pagination-arrow.svg" alt="" width={12} height={12} className="rotate-180" aria-hidden />
            Prev
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink-soft opacity-40">
            <Image src="/marketplace/pagination-arrow.svg" alt="" width={12} height={12} className="rotate-180" aria-hidden />
            Prev
          </span>
        )}

        {pageNumbers.map((n, i) => (
          <span key={n} className="flex items-center gap-2">
            {i > 0 && pageNumbers[i - 1] !== n - 1 && <span className="text-ink-soft/50">…</span>}
            {n === page ? (
              <span className="flex size-8 items-center justify-center rounded-lg bg-ink text-xs font-medium text-white">
                {n}
              </span>
            ) : (
              <Link
                href={hrefFor(n)}
                className="flex size-8 items-center justify-center rounded-lg text-xs font-medium text-ink-soft hover:bg-mint/60"
              >
                {n}
              </Link>
            )}
          </span>
        ))}

        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className="flex items-center gap-1 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white hover:bg-ink/85"
          >
            Next
            <Image src="/marketplace/pagination-arrow.svg" alt="" width={12} height={12} className="invert" aria-hidden />
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white opacity-40">
            Next
            <Image src="/marketplace/pagination-arrow.svg" alt="" width={12} height={12} className="invert" aria-hidden />
          </span>
        )}
      </div>
    </div>
  );
}
