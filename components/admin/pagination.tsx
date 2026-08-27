import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Shared Prev/Next + page-number pagination for every admin list page
 * (Vendors, Users, Global Inventory, Orders, Transactions) — one
 * implementation instead of each page hand-rolling its own page links. */
export function AdminPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1,
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-xs text-text-muted">
        Showing <span className="font-medium text-ink">{rangeStart}-{rangeEnd}</span> of{" "}
        <span className="font-medium text-ink">{totalCount.toLocaleString("en-NG")}</span> results
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-ink">
            <ChevronLeft className="size-3.5" aria-hidden />
            Prev
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-soft opacity-40">
            <ChevronLeft className="size-3.5" aria-hidden />
            Prev
          </span>
        )}

        {pageNumbers.map((n, i) => (
          <span key={n} className="flex items-center gap-2">
            {i > 0 && pageNumbers[i - 1] !== n - 1 && <span className="text-text-muted/60">…</span>}
            {n === page ? (
              <span className="flex size-7 items-center justify-center rounded-lg bg-ink text-xs font-medium text-white">{n}</span>
            ) : (
              <Link href={hrefFor(n)} className="flex size-7 items-center justify-center rounded-lg text-xs font-medium text-ink-soft hover:bg-mint/60">
                {n}
              </Link>
            )}
          </span>
        ))}

        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} className="flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-ink/85">
            Next
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white opacity-40">
            Next
            <ChevronRight className="size-3.5" aria-hidden />
          </span>
        )}
      </div>
    </div>
  );
}
