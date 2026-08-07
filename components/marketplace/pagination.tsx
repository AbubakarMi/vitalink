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
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
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
    return query ? `/products?${query}` : "/products";
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1,
  );

  return (
    <div className="mx-auto flex max-w-[1282px] flex-wrap items-center justify-between gap-4 rounded-[5px] bg-white px-9 py-5 text-xs">
      <p className="text-verified">
        Showing <span className="font-bold">{rangeStart}-{rangeEnd}</span> of{" "}
        <span className="font-bold">{totalCount}</span> results
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="flex items-center gap-1 rounded-[5px] border-2 border-verified px-4 py-2 font-bold text-verified"
          >
            <Image src="/marketplace/pagination-arrow.svg" alt="" width={12} height={12} className="rotate-180" aria-hidden />
            Prev
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-[5px] border-2 border-verified px-4 py-2 font-bold text-verified opacity-40">
            <Image src="/marketplace/pagination-arrow.svg" alt="" width={12} height={12} className="rotate-180" aria-hidden />
            Prev
          </span>
        )}

        {pageNumbers.map((n, i) => (
          <span key={n} className="flex items-center gap-2">
            {i > 0 && pageNumbers[i - 1] !== n - 1 && <span className="text-verified opacity-60">…</span>}
            {n === page ? (
              <span className="flex size-7 items-center justify-center rounded-[5px] bg-[#4a7a4a] font-bold text-white">
                {n}
              </span>
            ) : (
              <Link
                href={hrefFor(n)}
                className="flex size-7 items-center justify-center rounded-[5px] text-verified hover:bg-[#f0ffdf]"
              >
                {n}
              </Link>
            )}
          </span>
        ))}

        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className="flex items-center gap-1 rounded-[5px] bg-verified px-4 py-2 font-bold text-white"
          >
            Next
            <Image src="/marketplace/pagination-arrow.svg" alt="" width={12} height={12} className="invert" aria-hidden />
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-[5px] bg-verified px-4 py-2 font-bold text-white opacity-40">
            Next
            <Image src="/marketplace/pagination-arrow.svg" alt="" width={12} height={12} className="invert" aria-hidden />
          </span>
        )}
      </div>
    </div>
  );
}
