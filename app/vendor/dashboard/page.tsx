import Link from "next/link";
import { TrendingUp, Wallet, Layers, AlertTriangle, PackageCheck, Plus, ArrowRight } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { getVendorProfile } from "@/lib/api/vendor-profile";
import { listProductsForVendor } from "@/lib/api/vendor-products";
import { getVendorOrderStats, listRecentOrdersForVendor } from "@/lib/api/vendor-orders";
import { StatusPill } from "@/components/vendor/status-pill";
import { VendorTableShell, VendorTableHead, VendorTableHeadCell, VendorTableRow, VendorTableCell, VendorTableEmpty } from "@/components/vendor/vendor-table";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Real vendor profile/inventory counts; Total Sales/Wallet Balance are
 * computed over the seeded mock order dataset — no Order/Wallet API yet
 * (design doc §1, §3). */
export default async function VendorDashboardPage() {
  await requireAccountType("vendor", "/vendor/dashboard");
  const [profile, products, orderStats, recentOrders] = await Promise.all([
    getVendorProfile(),
    listProductsForVendor(),
    getVendorOrderStats(),
    listRecentOrdersForVendor(7),
  ]);

  const liveCount = products.filter((p) => p.status === "Active").length;
  const lowStockCount = products.filter(
    (p) => p.status !== "Archived" && p.status !== "Rejected" && (p.stockCount ?? 0) <= (p.lowStockThreshold ?? Infinity),
  ).length;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{profile?.businessLegalName ?? "Overview"}</h1>
          <p className="mt-1 text-sm text-text-muted">Here&apos;s what&apos;s happening with your store today.</p>
        </div>
        <Link
          href="/vendor/products/new"
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85"
        >
          <Plus className="size-4" aria-hidden />
          Add New Product
        </Link>
      </div>

      {orderStats.pendingCount > 0 && (
        <Link
          href="/vendor/orders"
          className="mt-6 flex items-center gap-4 rounded-2xl border border-ink bg-ink/[0.03] p-5 transition-colors hover:bg-ink/[0.06]"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-white">
            <PackageCheck className="size-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-ink">Fulfill Orders</span>
            <span className="block text-sm text-text-muted">
              Authorize {orderStats.pendingCount} pending order{orderStats.pendingCount === 1 ? "" : "s"}
            </span>
          </span>
          <ArrowRight className="size-4 text-ink" aria-hidden />
        </Link>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Total Sales" value={`N${orderStats.totalSales.toLocaleString("en-NG")}`} />
        <StatCard icon={Wallet} label="Wallet Balance" value={`N${orderStats.walletBalance.toLocaleString("en-NG")}`} />
        <StatCard icon={Layers} label="Live Products" value={`${liveCount}`} suffix="products" />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock Alerts"
          value={`${lowStockCount}`}
          suffix="products"
          tone={lowStockCount > 0 ? "danger" : "default"}
        />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Recent Orders</h2>
        <Link href="/vendor/orders" className="flex items-center gap-1 text-sm font-medium text-verified hover:text-ink">
          View all Orders <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="mt-3">
        <VendorTableShell>
          <VendorTableHead>
            <VendorTableHeadCell>Order ID</VendorTableHeadCell>
            <VendorTableHeadCell>Entity</VendorTableHeadCell>
            <VendorTableHeadCell>Brand</VendorTableHeadCell>
            <VendorTableHeadCell>Total</VendorTableHeadCell>
            <VendorTableHeadCell>Date</VendorTableHeadCell>
            <VendorTableHeadCell>Status</VendorTableHeadCell>
            <VendorTableHeadCell>Actions</VendorTableHeadCell>
          </VendorTableHead>
          <tbody>
            {recentOrders.length === 0 && <VendorTableEmpty colSpan={7}>No orders yet.</VendorTableEmpty>}
            {recentOrders.map((order) => (
              <VendorTableRow key={order.id}>
                <VendorTableCell className="font-mono text-xs text-text-muted">{order.id}</VendorTableCell>
                <VendorTableCell>
                  <span className="block font-medium">{order.customerEntity}</span>
                  <span className="block text-xs text-text-muted">{order.customerLocation}</span>
                </VendorTableCell>
                <VendorTableCell>{order.items[0]?.brand ?? "—"}</VendorTableCell>
                <VendorTableCell>N{order.total.toLocaleString("en-NG")}</VendorTableCell>
                <VendorTableCell className="text-text-muted">
                  {new Date(order.placedAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                </VendorTableCell>
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
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  tone = "default",
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  suffix?: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-text-muted uppercase">{label}</p>
        <Icon className={tone === "danger" ? "size-4 text-[#c0392b]" : "size-4 text-text-muted"} aria-hidden />
      </div>
      <p className={tone === "danger" ? "mt-2 font-[family-name:var(--font-newsreader)] text-2xl text-[#c0392b]" : "mt-2 font-[family-name:var(--font-newsreader)] text-2xl text-ink"}>
        {value} {suffix && <span className="text-sm font-sans text-text-muted">{suffix}</span>}
      </p>
    </div>
  );
}
