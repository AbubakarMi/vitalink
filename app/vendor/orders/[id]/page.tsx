import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck, Ban } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { getVendorOrderById, nextOrderStatus } from "@/lib/api/vendor-orders";
import { StatusPill } from "@/components/vendor/status-pill";
import { ConfirmSubmitButton } from "@/components/vendor/confirm-submit-button";
import { advanceOrderAction, cancelOrderAction } from "./actions";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

interface PageProps {
  params: Promise<{ id: string }>;
}

const NEXT_ACTION_LABEL: Record<string, string> = {
  Processing: "Start Processing",
  Transit: "Mark In Transit",
  Delivered: "Mark Delivered",
};

/** No order-detail mockup was supplied (design doc §1 flagged this gap) —
 * built to match the rest of the vendor dashboard rather than left as a
 * placeholder, since "View" from both Overview and the Orders list needs
 * somewhere to land. */
export default async function VendorOrderDetailPage({ params }: PageProps) {
  await requireAccountType("vendor", "/vendor/orders");
  const { id } = await params;
  const order = await getVendorOrderById(id);
  if (!order) {
    notFound();
  }

  const next = nextOrderStatus(order.status);
  const canCancel = order.status !== "Delivered" && order.status !== "Cancelled";

  return (
    <div>
      <Link href="/vendor/orders" className="text-sm font-medium text-text-muted hover:text-ink">
        ← Orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink">{order.id}</h1>
        <StatusPill status={order.status} />
      </div>
      <p className="mt-1 text-sm text-text-muted">
        Placed {new Date(order.placedAt).toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" })}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-line p-5">
            <p className="text-xs font-medium tracking-wide text-text-muted uppercase">Customer</p>
            <p className="mt-2 font-semibold text-ink">{order.customerEntity}</p>
            <p className="text-sm text-text-muted">{order.customerLocation}</p>
            <p className="mt-1 text-sm text-text-muted">{order.customerType}</p>
          </div>

          <div className="rounded-2xl border border-line p-5">
            <p className="text-xs font-medium tracking-wide text-text-muted uppercase">Order Total</p>
            <p className="mt-2 font-[family-name:var(--font-newsreader)] text-2xl text-ink">N{order.total.toLocaleString("en-NG")}</p>
            <p className="mt-1 text-sm text-text-muted">
              {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
            </p>
          </div>

          {(next || canCancel) && (
            <div className="flex flex-col gap-2">
              {next && (
                <form action={advanceOrderAction.bind(null, order.id)}>
                  <ConfirmSubmitButton
                    confirmMessage={`${NEXT_ACTION_LABEL[next] ?? `Mark ${next}`} for order ${order.id}?`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85"
                  >
                    <Truck className="size-4" aria-hidden />
                    {NEXT_ACTION_LABEL[next] ?? `Mark ${next}`}
                  </ConfirmSubmitButton>
                </form>
              )}
              {canCancel && (
                <form action={cancelOrderAction.bind(null, order.id)}>
                  <ConfirmSubmitButton
                    confirmMessage={`Cancel order ${order.id}? This can't be undone.`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-[#c0392b] hover:bg-[#fff0ee]"
                  >
                    <Ban className="size-3.5" aria-hidden /> Cancel Order
                  </ConfirmSubmitButton>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-cream/60 text-xs font-medium tracking-wide text-text-muted uppercase">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Brand</th>
                <th className="px-5 py-3 font-medium">Qty</th>
                <th className="px-5 py-3 font-medium">Unit Price</th>
                <th className="px-5 py-3 font-medium">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={`${item.productId}-${i}`} className="border-b border-line/70 last:border-b-0">
                  <td className="px-5 py-4 text-ink">{item.productName}</td>
                  <td className="px-5 py-4 text-ink">{item.brand}</td>
                  <td className="px-5 py-4 text-ink">{item.quantity}</td>
                  <td className="px-5 py-4 text-ink">N{item.unitPrice.toLocaleString("en-NG")}</td>
                  <td className="px-5 py-4 font-medium text-ink">N{(item.quantity * item.unitPrice).toLocaleString("en-NG")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
