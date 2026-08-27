import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { getAdminOrderDetails } from "@/lib/api/admin/orders";
import { StatusPill } from "@/components/admin/status-pill";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** No backend Order API yet — mock-only, see lib/api/admin/orders.ts. Layout
 * follows the client-supplied order-detail mockup (Products list, payment
 * breakdown, customer info, activity timeline). */
export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAccountType("admin", "/admin/orders");
  const { id } = await params;
  const order = await getAdminOrderDetails(id).catch(() => null);

  if (!order) {
    return (
      <main className="mx-auto max-w-5xl space-y-6">
        <Link href="/admin/orders" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden />
          Back to Orders
        </Link>
        <p className="rounded-2xl border border-line bg-white px-8 py-14 text-center text-sm text-text-muted">
          This order couldn&apos;t be loaded.
        </p>
      </main>
    );
  }

  const deliveryFee = 34000;
  const subtotal = order.total;
  const platformCommission = Math.round(subtotal * 0.1);

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <Link href="/admin/orders" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Back to Orders
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink">Order Details</h1>
        <StatusPill status={order.status} />
        <span className="text-sm text-text-muted">#{order.orderNumber}</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-white p-6">
            <p className="text-sm font-semibold text-ink">Products List</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs font-medium tracking-wide text-text-muted uppercase">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Product</th>
                    <th className="py-2 pr-3 font-medium">Price</th>
                    <th className="py-2 pr-3 font-medium">Qty</th>
                    <th className="py-2 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {order.items.map((item, i) => (
                    <tr key={`${item.productId}-${i}`}>
                      <td className="py-3 pr-3">
                        <p className="font-medium text-ink">{item.name}</p>
                        {item.sku && <p className="text-xs text-text-muted">SKU: {item.sku}</p>}
                      </td>
                      <td className="py-3 pr-3 text-ink">N{item.price.toLocaleString("en-NG")}</td>
                      <td className="py-3 pr-3 text-ink">{item.quantity}</td>
                      <td className="py-3 text-ink">N{(item.price * item.quantity).toLocaleString("en-NG")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex items-center justify-between text-text-muted">
                <span>Subtotal ({order.itemCount} items)</span>
                <span className="text-ink">N{subtotal.toLocaleString("en-NG")}</span>
              </div>
              <div className="flex items-center justify-between text-text-muted">
                <span>Delivery fee</span>
                <span className="text-ink">N{deliveryFee.toLocaleString("en-NG")}</span>
              </div>
              <div className="flex items-center justify-between text-text-muted">
                <span>Platform commission (10%)</span>
                <span className="text-ink">N{platformCommission.toLocaleString("en-NG")}</span>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-2 text-sm font-semibold text-ink">
                <span>Total</span>
                <span>N{(subtotal + deliveryFee).toLocaleString("en-NG")}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6">
            <p className="text-sm font-semibold text-ink">Activity</p>
            <div className="mt-4 space-y-4">
              {[...order.activity].reverse().map((entry, i) => (
                <div key={entry.label} className="flex items-start gap-3">
                  <span
                    className={`mt-1 size-2 shrink-0 rounded-full ${i === 0 ? "bg-verified" : "bg-line"}`}
                    aria-hidden
                  />
                  <div>
                    <p className={`text-sm ${i === 0 ? "font-medium text-ink" : "text-text-muted"}`}>{entry.label}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(entry.at).toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">Customer Information</p>
            <p className="mt-3 font-medium text-ink">{order.customerName}</p>
            <div className="mt-2 space-y-1.5 text-sm text-text-muted">
              <p className="flex items-center gap-1.5">
                <Mail className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{order.customerEmail}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="size-3.5 shrink-0" aria-hidden />
                {order.customerPhone}
              </p>
              <p className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {order.deliveryAddress}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">Fulfilled by</p>
            <p className="mt-2 font-medium text-ink">{order.vendorName}</p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">Placed</p>
            <p className="mt-2 text-ink">
              {new Date(order.placedAt).toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
