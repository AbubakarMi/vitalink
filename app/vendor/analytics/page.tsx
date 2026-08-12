import { TrendingUp, ShoppingBag, Receipt, Layers } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { listOrdersForVendor, getVendorOrderStats, type VendorOrderStatus } from "@/lib/api/vendor-orders";
import { listProductsForVendor } from "@/lib/api/vendor-products";
import { BarChart, HorizontalBarList, StatusBreakdown } from "@/components/vendor/analytics-charts";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

const STATUS_COLORS: Record<VendorOrderStatus, string> = {
  Pending: "#d97706",
  Processing: "#d97706",
  Transit: "#4338ca",
  Delivered: "#006b5f",
  Cancelled: "#dc2626",
};

const MS_PER_DAY = 86_400_000;

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** No mockup or spec existed for Analytics anywhere in the reference folder
 * (design doc §1) — designed from scratch against the data already in the
 * mock store (orders, products) rather than fabricated figures. */
export default async function VendorAnalyticsPage() {
  await requireAccountType("vendor", "/vendor/analytics");
  const [orders, products, stats] = await Promise.all([listOrdersForVendor(), listProductsForVendor(), getVendorOrderStats()]);

  const deliveredOrders = orders.filter((o) => o.status === "Delivered");
  const avgOrderValue = deliveredOrders.length > 0 ? Math.round(stats.totalSales / deliveredOrders.length) : 0;
  const liveCount = products.filter((p) => p.status === "Active").length;

  // Sales by week — last 6 weeks, summed over Delivered orders' placedAt.
  const weekCount = 6;
  const now = new Date();
  const weekStarts = Array.from({ length: weekCount }, (_, i) => {
    const weekStart = startOfWeek(now);
    weekStart.setDate(weekStart.getDate() - (weekCount - 1 - i) * 7);
    return weekStart;
  });
  const salesByWeek = weekStarts.map((weekStart) => {
    const weekEnd = new Date(weekStart.getTime() + 7 * MS_PER_DAY);
    const total = deliveredOrders
      .filter((o) => {
        const placed = new Date(o.placedAt);
        return placed >= weekStart && placed < weekEnd;
      })
      .reduce((sum, o) => sum + o.total, 0);
    return { label: weekStart.toLocaleDateString("en-NG", { day: "2-digit", month: "short" }), value: total };
  });

  // Top products by revenue, across every order regardless of status (demand
  // signal, not just realized/Delivered revenue).
  const revenueByProduct = new Map<string, { name: string; value: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const existing = revenueByProduct.get(item.productId);
      const lineTotal = item.quantity * item.unitPrice;
      revenueByProduct.set(item.productId, {
        name: item.productName,
        value: (existing?.value ?? 0) + lineTotal,
      });
    }
  }
  const topProducts = [...revenueByProduct.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((p) => ({ label: p.name, value: p.value }));

  const statusOrder: VendorOrderStatus[] = ["Pending", "Processing", "Transit", "Delivered", "Cancelled"];
  const statusSegments = statusOrder.map((status) => ({
    label: status,
    count: orders.filter((o) => o.status === status).length,
    color: STATUS_COLORS[status],
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Analytics</h1>
      <p className="mt-1 text-sm text-text-muted">Sales trends and product performance, computed from your orders and inventory.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={TrendingUp} label="Total Sales" value={`N${stats.totalSales.toLocaleString("en-NG")}`} />
        <StatTile icon={ShoppingBag} label="Delivered Orders" value={`${deliveredOrders.length}`} />
        <StatTile icon={Receipt} label="Avg. Order Value" value={`N${avgOrderValue.toLocaleString("en-NG")}`} />
        <StatTile icon={Layers} label="Live Products" value={`${liveCount}`} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-ink">Sales by Week</h2>
          <p className="text-xs text-text-muted">Delivered order revenue, last 6 weeks</p>
          <div className="mt-6">
            <BarChart data={salesByWeek} formatValue={(n) => `N${n.toLocaleString("en-NG")}`} />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-ink">Orders by Status</h2>
          <p className="text-xs text-text-muted">All-time, {orders.length} orders</p>
          <div className="mt-6">
            <StatusBreakdown segments={statusSegments} />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink">Top Products by Revenue</h2>
          <p className="text-xs text-text-muted">Across all orders, any status</p>
          <div className="mt-6">
            <HorizontalBarList data={topProducts} formatValue={(n) => `N${n.toLocaleString("en-NG")}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-text-muted uppercase">{label}</p>
        <Icon className="size-4 text-text-muted" aria-hidden />
      </div>
      <p className="mt-2 font-[family-name:var(--font-newsreader)] text-2xl text-ink">{value}</p>
    </div>
  );
}
