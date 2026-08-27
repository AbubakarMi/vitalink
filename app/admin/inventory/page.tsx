import Link from "next/link";
import { Search } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { listAdminProducts } from "@/lib/api/admin/products";
import { StatusPill } from "@/components/admin/status-pill";
import { AdminPagination } from "@/components/admin/pagination";
import {
  AdminTableShell,
  AdminTableHead,
  AdminTableHeadCell,
  AdminTableRow,
  AdminTableCell,
  AdminTableEmpty,
} from "@/components/admin/admin-table";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

const STATUS_TABS = [
  { label: "All Products", value: undefined },
  { label: "Active", value: "Active" },
  { label: "Pending Review", value: "PendingReview" },
  { label: "Archived", value: "Archived" },
  { label: "Rejected", value: "Rejected" },
] as const;

/**
 * Global Inventory — super admin/Vendor Inventory.pdf. Backed by
 * lib/api/admin/products.ts, a real endpoint whose response shape isn't
 * confirmed against the backend yet (deferred per "build the frontend now,
 * review the backend later") — the whole page degrades to an honest empty
 * state rather than crashing if the shape doesn't match once wired to live.
 */
export default async function AdminInventoryPage({ searchParams }: PageProps) {
  await requireAccountType("admin", "/admin/inventory");
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const activeStatus = STATUS_TABS.find((t) => t.value === params.status)?.value;

  const result = await listAdminProducts({
    page,
    pageSize: 12,
    search: params.search,
    status: activeStatus,
  }).catch(() => null);

  const counts = await Promise.all(
    STATUS_TABS.filter((t) => t.value).map((t) =>
      listAdminProducts({ pageSize: 1, status: t.value })
        .then((r) => [t.label, r.totalCount] as const)
        .catch(() => [t.label, null] as const),
    ),
  );

  if (result === null) {
    return (
      <main className="space-y-6">
        <h1 className="text-2xl font-semibold text-ink">Global Inventory</h1>
        <p className="rounded-2xl border border-line bg-white px-8 py-14 text-center text-sm text-text-muted">
          Product inventory isn&apos;t available yet — check back once the catalog moderation API is live.
        </p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Global Inventory</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map(([label, count]) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-5">
            <p className="text-xs font-medium tracking-wide text-text-muted uppercase">{label}</p>
            <p className="mt-2 font-[family-name:var(--font-newsreader)] text-2xl text-ink">
              {count === null ? "—" : count.toLocaleString("en-NG")}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap gap-1 rounded-full border border-line bg-white p-1">
          {STATUS_TABS.map((tab) => {
            const active = tab.value === activeStatus;
            const href = tab.value ? `/admin/inventory?status=${tab.value}` : "/admin/inventory";
            return (
              <Link
                key={tab.label}
                href={href}
                className={
                  active
                    ? "rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-white"
                    : "rounded-full px-4 py-1.5 text-xs font-medium text-text-muted hover:text-ink"
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <form action="/admin/inventory" className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5">
          {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
          <Search className="size-4 text-ink-soft/50" aria-hidden />
          <input
            type="search"
            name="search"
            defaultValue={params.search}
            placeholder="Search by product name"
            className="w-56 bg-transparent text-sm text-ink-soft outline-none placeholder:text-text-muted"
          />
        </form>
      </div>

      <AdminTableShell>
        <AdminTableHead>
          <AdminTableHeadCell>Product</AdminTableHeadCell>
          <AdminTableHeadCell>Vendor</AdminTableHeadCell>
          <AdminTableHeadCell>Brand</AdminTableHeadCell>
          <AdminTableHeadCell>Price</AdminTableHeadCell>
          <AdminTableHeadCell>Status</AdminTableHeadCell>
          <AdminTableHeadCell className="text-right">Actions</AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {result.data.length === 0 ? (
            <AdminTableEmpty colSpan={6}>No products match that filter.</AdminTableEmpty>
          ) : (
            result.data.map((product) => (
              <AdminTableRow key={product.id}>
                <AdminTableCell>
                  <p className="font-medium">{product.name}</p>
                  {product.sku && <p className="text-xs text-text-muted">SKU: {product.sku}</p>}
                </AdminTableCell>
                <AdminTableCell className="text-text-muted">{product.vendorName ?? "—"}</AdminTableCell>
                <AdminTableCell className="text-text-muted">{product.brand ?? "—"}</AdminTableCell>
                <AdminTableCell>N{product.price.toLocaleString("en-NG")}</AdminTableCell>
                <AdminTableCell>
                  <StatusPill status={product.status} />
                </AdminTableCell>
                <AdminTableCell className="text-right">
                  <Link href={`/admin/inventory/${product.id}`} className="text-sm font-medium text-verified hover:underline">
                    View
                  </Link>
                </AdminTableCell>
              </AdminTableRow>
            ))
          )}
        </tbody>
      </AdminTableShell>

      <AdminPagination
        page={page}
        totalPages={result.totalPages}
        totalCount={result.totalCount}
        pageSize={result.pageSize}
        basePath="/admin/inventory"
        searchParams={{ status: activeStatus, search: params.search }}
      />
    </main>
  );
}
