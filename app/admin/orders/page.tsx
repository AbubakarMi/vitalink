import Link from "next/link";
import { Search } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { listAdminOrders } from "@/lib/api/admin/orders";
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
  { label: "All Orders", value: undefined },
  { label: "Pending", value: "Pending" },
  { label: "Processing", value: "Processing" },
  { label: "Transit", value: "Transit" },
  { label: "Delivered", value: "Delivered" },
  { label: "Cancelled", value: "Cancelled" },
] as const;

/** Order fulfillment — dashboard's "Fulfill Orders" quick action. No backend
 * Order API exists yet (design doc §1), so mock-only (lib/api/admin/orders.ts),
 * same as buyer/vendor mock data. */
export default async function AdminOrdersPage({ searchParams }: PageProps) {
  await requireAccountType("admin", "/admin/orders");
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const activeStatus = STATUS_TABS.find((t) => t.value === params.status)?.value;

  const result = await listAdminOrders({ page, pageSize: 12, search: params.search, status: activeStatus });

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Orders</h1>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap gap-1 rounded-full border border-line bg-white p-1">
          {STATUS_TABS.map((tab) => {
            const active = tab.value === activeStatus;
            const href = tab.value ? `/admin/orders?status=${tab.value}` : "/admin/orders";
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

        <form action="/admin/orders" className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5">
          {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
          <Search className="size-4 text-ink-soft/50" aria-hidden />
          <input
            type="search"
            name="search"
            defaultValue={params.search}
            placeholder="Search by order ID or customer"
            className="w-56 bg-transparent text-sm text-ink-soft outline-none placeholder:text-text-muted"
          />
        </form>
      </div>

      <AdminTableShell>
        <AdminTableHead>
          <AdminTableHeadCell>Order</AdminTableHeadCell>
          <AdminTableHeadCell>Customer</AdminTableHeadCell>
          <AdminTableHeadCell>Vendor</AdminTableHeadCell>
          <AdminTableHeadCell>Items</AdminTableHeadCell>
          <AdminTableHeadCell>Total</AdminTableHeadCell>
          <AdminTableHeadCell>Status</AdminTableHeadCell>
          <AdminTableHeadCell>Placed</AdminTableHeadCell>
          <AdminTableHeadCell className="text-right">Actions</AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {result.data.length === 0 ? (
            <AdminTableEmpty colSpan={8}>No orders match that filter.</AdminTableEmpty>
          ) : (
            result.data.map((order) => (
              <AdminTableRow key={order.id}>
                <AdminTableCell className="font-medium">{order.orderNumber}</AdminTableCell>
                <AdminTableCell className="text-text-muted">{order.customerName}</AdminTableCell>
                <AdminTableCell className="text-text-muted">{order.vendorName}</AdminTableCell>
                <AdminTableCell className="text-text-muted">{order.itemCount}</AdminTableCell>
                <AdminTableCell>N{order.total.toLocaleString("en-NG")}</AdminTableCell>
                <AdminTableCell>
                  <StatusPill status={order.status} />
                </AdminTableCell>
                <AdminTableCell className="text-text-muted">
                  {new Date(order.placedAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                </AdminTableCell>
                <AdminTableCell className="text-right">
                  <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium text-verified hover:underline">
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
        basePath="/admin/orders"
        searchParams={{ status: activeStatus, search: params.search }}
      />
    </main>
  );
}
