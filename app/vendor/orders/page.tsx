import Link from "next/link";
import { Search } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { listOrdersForVendor, getVendorOrderStats, type VendorOrderStatus } from "@/lib/api/vendor-orders";
import { StatusPill } from "@/components/vendor/status-pill";
import { VendorTableShell, VendorTableHead, VendorTableHeadCell, VendorTableRow, VendorTableCell, VendorTableEmpty } from "@/components/vendor/vendor-table";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

const PAGE_SIZE = 10;
const STATUS_FILTERS: { value: VendorOrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Processing", label: "Processing" },
  { value: "Transit", label: "Transit" },
  { value: "Delivered", label: "Delivered" },
  { value: "Cancelled", label: "Cancelled" },
];

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

/** Order History (Vendor Oder.pdf) and Order Fulfilment (Vendor Order
 * Page.pdf) were two near-duplicate mockups for the same list, differing
 * only in title and a relabeled QTY/"Number of Items" column — reconciled
 * here as one page. Real mock order data (design doc §1). */
export default async function VendorOrdersPage({ searchParams }: PageProps) {
  await requireAccountType("vendor", "/vendor/orders");
  const params = await searchParams;
  const [allOrders, stats] = await Promise.all([listOrdersForVendor(), getVendorOrderStats()]);

  const query = (params.q ?? "").trim().toLowerCase();
  const statusFilter = (params.status ?? "all") as VendorOrderStatus | "all";
  const filtered = allOrders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (query && !order.id.toLowerCase().includes(query)) return false;
    return true;
  });

  const page = Math.max(1, Number(params.page) || 1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Orders</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={allOrders.length} valueClassName="text-ink" />
        <StatCard label="Delivered" value={stats.deliveredCount} valueClassName="text-verified" />
        <StatCard label="Pending" value={stats.pendingCount} valueClassName="text-[#a15c00]" />
        <StatCard label="Cancelled" value={stats.cancelledCount} valueClassName="text-[#c0392b]" />
      </div>

      <form className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" method="get">
        <h2 className="text-lg font-semibold text-ink">Order History</h2>
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
              placeholder="Search by order ID"
              className="w-full rounded-xl border border-line bg-white py-2.5 pr-3 pl-10 text-sm text-ink outline-none focus:border-ink/40 sm:w-64"
            />
          </div>
        </div>
      </form>

      <div className="mt-4">
        <VendorTableShell>
          <VendorTableHead>
            <VendorTableHeadCell>Order ID</VendorTableHeadCell>
            <VendorTableHeadCell>Date</VendorTableHeadCell>
            <VendorTableHeadCell>Customer Type</VendorTableHeadCell>
            <VendorTableHeadCell>Items</VendorTableHeadCell>
            <VendorTableHeadCell>Total</VendorTableHeadCell>
            <VendorTableHeadCell>Status</VendorTableHeadCell>
            <VendorTableHeadCell>Action</VendorTableHeadCell>
          </VendorTableHead>
          <tbody>
            {pageItems.length === 0 && (
              <VendorTableEmpty colSpan={7}>
                {allOrders.length === 0 ? "No orders yet." : "No orders match your search/filter."}
              </VendorTableEmpty>
            )}
            {pageItems.map((order) => (
              <VendorTableRow key={order.id}>
                <VendorTableCell className="font-mono text-xs text-text-muted">{order.id}</VendorTableCell>
                <VendorTableCell className="text-text-muted">
                  {new Date(order.placedAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                </VendorTableCell>
                <VendorTableCell>{order.customerType}</VendorTableCell>
                <VendorTableCell>{order.itemCount}</VendorTableCell>
                <VendorTableCell>N{order.total.toLocaleString("en-NG")}</VendorTableCell>
                <VendorTableCell>
                  <StatusPill status={order.status} />
                </VendorTableCell>
                <VendorTableCell>
                  <Link href={`/vendor/orders/${order.id}`} className="font-medium text-verified hover:text-ink">
                    View
                  </Link>
                </VendorTableCell>
              </VendorTableRow>
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

function StatCard({ label, value, valueClassName }: { label: string; value: number; valueClassName: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs font-medium tracking-wide text-text-muted uppercase">{label}</p>
      <p className={`mt-1.5 font-[family-name:var(--font-newsreader)] text-2xl ${valueClassName}`}>
        {value} <span className="text-sm font-sans text-text-muted">orders</span>
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
    <Link href={`/vendor/orders?${query.toString()}`} className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:border-ink/40">
      {children}
    </Link>
  );
}
