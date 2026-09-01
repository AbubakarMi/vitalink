import Link from "next/link";
import Image from "next/image";
import { Search, Plus, ImageOff } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { listProductsForVendor, getVendorProductStats } from "@/lib/api/vendor-products";
import type { Product, VendorProductStatus } from "@/lib/api/products";
import { StatusPill } from "@/components/vendor/status-pill";
import { VendorTableShell, VendorTableHead, VendorTableHeadCell, VendorTableRow, VendorTableCell, VendorTableEmpty } from "@/components/vendor/vendor-table";
import { ArchiveConfirmButton } from "@/components/vendor/archive-confirm-button";
import { archiveProductAction } from "./actions";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

const PAGE_SIZE = 8;
const STATUS_FILTERS: { value: VendorProductStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "Active", label: "Active" },
  { value: "PendingReview", label: "Pending Review" },
  { value: "OutOfStock", label: "Out of Stock" },
  { value: "Archived", label: "Archived" },
  { value: "Rejected", label: "Rejected" },
];

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

/** Real mock inventory (design doc §1, §4) — search/status/pagination are
 * server-rendered GET params, same pattern as the marketplace listing page. */
export default async function VendorProductsPage({ searchParams }: PageProps) {
  await requireAccountType("vendor", "/vendor/products");
  const params = await searchParams;
  const [allProducts, stats] = await Promise.all([listProductsForVendor(), getVendorProductStats()]);

  const query = (params.q ?? "").trim().toLowerCase();
  const statusFilter = (params.status ?? "all") as VendorProductStatus | "all";
  const filtered = allProducts.filter((product) => {
    if (statusFilter !== "all" && product.status !== statusFilter) return false;
    if (query && !product.name.toLowerCase().includes(query)) return false;
    return true;
  });

  const page = Math.max(1, Number(params.page) || 1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-ink">Global Inventory</h1>
        <Link
          href="/vendor/products/new"
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85"
        >
          <Plus className="size-4" aria-hidden />
          Add New Product
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="All Products" value={stats.all} valueClassName="text-ink" />
        <StatCard label="Active" value={stats.active} valueClassName="text-verified" />
        <StatCard label="Pending Review" value={stats.pendingReview} valueClassName="text-[#a15c00]" />
        <StatCard label="Rejected" value={stats.rejected} valueClassName="text-[#c0392b]" />
      </div>

      <form className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" method="get">
        <h2 className="text-lg font-semibold text-ink">Inventory</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/40"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder="Search by product name"
              className="w-full rounded-xl border border-line bg-white py-2.5 pr-3 pl-10 text-sm text-ink outline-none focus:border-ink/40 sm:w-64"
            />
          </div>
        </div>
      </form>

      <div className="mt-4">
        <VendorTableShell>
          <VendorTableHead>
            <VendorTableHeadCell>Product Info</VendorTableHeadCell>
            <VendorTableHeadCell>Price</VendorTableHeadCell>
            <VendorTableHeadCell>Brand</VendorTableHeadCell>
            <VendorTableHeadCell>Category</VendorTableHeadCell>
            <VendorTableHeadCell>Status</VendorTableHeadCell>
            <VendorTableHeadCell>Actions</VendorTableHeadCell>
          </VendorTableHead>
          <tbody>
            {pageItems.length === 0 && (
              <VendorTableEmpty colSpan={6}>
                {allProducts.length === 0
                  ? "No products yet — add your first product to get started."
                  : "No products match your search/filter."}
              </VendorTableEmpty>
            )}
            {pageItems.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </tbody>
        </VendorTableShell>

        {filtered.length > 0 && (
          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-text-muted">
              Showing {pageItems.length} of {filtered.length} results
            </p>
            <div className="flex items-center gap-2">
              <PageLink page={page - 1} disabled={page <= 1} params={params}>
                Prev
              </PageLink>
              <span className="px-2 text-sm text-text-muted">
                Page {page} of {totalPages}
              </span>
              <PageLink page={page + 1} disabled={page >= totalPages} params={params}>
                Next
              </PageLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductRow({ product }: { product: Product }) {
  return (
    <VendorTableRow>
      <VendorTableCell>
        <div className="flex items-center gap-3">
          <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-cream">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt="" fill className="object-contain p-1" sizes="48px" />
            ) : (
              <ImageOff className="size-4 text-text-muted" aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{product.name}</p>
            <p className="text-xs text-text-muted">SKU: {product.sku}</p>
            <p className="text-xs text-text-muted">{product.stockCount ?? 0} in stock</p>
          </div>
        </div>
      </VendorTableCell>
      <VendorTableCell>
        {product.promoPrice ? (
          <>
            <span className="block text-xs text-text-muted line-through">N{product.price.toLocaleString("en-NG")}</span>
            <span className="font-medium text-ink">N{product.promoPrice.toLocaleString("en-NG")}</span>
          </>
        ) : (
          <span className="font-medium text-ink">N{product.price.toLocaleString("en-NG")}</span>
        )}
      </VendorTableCell>
      <VendorTableCell>{product.brand}</VendorTableCell>
      <VendorTableCell>{product.categoryLabel}</VendorTableCell>
      <VendorTableCell>
        <StatusPill status={product.status ?? "PendingReview"} />
      </VendorTableCell>
      <VendorTableCell>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/vendor/products/${product.id}`} className="font-medium text-verified hover:text-ink">
            View
          </Link>
          <Link href={`/vendor/products/${product.id}/edit`} className="font-medium text-text-muted hover:text-ink">
            Edit
          </Link>
          {product.status !== "Archived" && (
            <ArchiveConfirmButton productName={product.name} onArchive={archiveProductAction.bind(null, product.id)} variant="text" />
          )}
        </div>
      </VendorTableCell>
    </VendorTableRow>
  );
}

function StatCard({ label, value, valueClassName }: { label: string; value: number; valueClassName: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs font-medium tracking-wide text-text-muted uppercase">{label}</p>
      <p className={`mt-1.5 font-[family-name:var(--font-newsreader)] text-2xl ${valueClassName}`}>
        {value} <span className="text-sm font-sans text-text-muted">products</span>
      </p>
    </div>
  );
}

function PageLink({
  page,
  disabled,
  params,
  children,
}: {
  page: number;
  disabled: boolean;
  params: { q?: string; status?: string };
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-lg border border-line px-3 py-1.5 text-sm text-text-muted/50">{children}</span>
    );
  }
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  query.set("page", String(page));
  return (
    <Link href={`/vendor/products?${query.toString()}`} className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:border-ink/40">
      {children}
    </Link>
  );
}
