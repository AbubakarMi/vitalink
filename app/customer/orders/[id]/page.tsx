import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAccountType } from "@/lib/auth/dal";
import { getCustomerOrderById, type CustomerOrderStatus } from "@/lib/api/customer-orders";
import { VitalsStatusTrace, VitalsCancelledTrace } from "@/components/customer/vitals-status-trace";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

interface PageProps {
  params: Promise<{ id: string }>;
}

const STAGES = ["Pending", "Processing", "Shipped", "Delivered"];

function stageIndex(status: CustomerOrderStatus): number {
  return STAGES.indexOf(status);
}

/** No order-detail mockup was supplied for the customer side either (same gap
 * as the vendor order detail) — designed to match the rest of the system. */
export default async function CustomerOrderDetailPage({ params }: PageProps) {
  // ["Vendor"]: see app/customer/orders/page.tsx's comment.
  await requireAccountType("customer", "/customer/orders", ["Vendor"]);
  const { id } = await params;
  const order = await getCustomerOrderById(id);
  if (!order) {
    notFound();
  }

  return (
    <div>
      <Link href="/customer/orders" className="text-sm font-medium text-text-muted hover:text-ink">
        ← Order History
      </Link>

      <div className="mt-4">
        <p className="font-mono text-xs tracking-[0.2em] text-verified uppercase">Order Readout</p>
        <h1 className="mt-1 font-[family-name:var(--font-newsreader)] text-3xl text-ink">{order.id}</h1>
        <p className="mt-1 text-sm text-text-muted">
          Placed {new Date(order.placedAt).toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white px-6 py-5">
        {order.status === "Cancelled" ? (
          <VitalsCancelledTrace />
        ) : (
          <VitalsStatusTrace stages={STAGES} currentIndex={stageIndex(order.status)} />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-line p-5">
            <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">Delivery Address</p>
            <p className="mt-2 text-sm text-ink">{order.deliveryAddress.addressLine}</p>
            <p className="text-sm text-text-muted">
              {order.deliveryAddress.city}, {order.deliveryAddress.state}, {order.deliveryAddress.country}
            </p>
          </div>

          <div className="rounded-2xl border border-line p-5">
            <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">Order Total</p>
            <div className="mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal</span>
                <span>N{order.subtotal.toLocaleString("en-NG")}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Delivery</span>
                <span>N{order.delivery.toLocaleString("en-NG")}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-1.5 font-semibold text-ink">
                <span>Total</span>
                <span>N{order.total.toLocaleString("en-NG")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-cream/60 font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Qty</th>
                <th className="px-5 py-3 font-medium">Unit Price</th>
                <th className="px-5 py-3 font-medium">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={`${item.productId}-${i}`} className="border-b border-line/70 last:border-b-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-cream">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt="" fill className="object-contain p-1" sizes="44px" />
                        ) : (
                          <ImageOff className="size-4 text-text-muted" aria-hidden />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-ink">{item.name}</p>
                        {item.sku && <p className="text-xs text-text-muted">SKU: {item.sku}</p>}
                      </div>
                    </div>
                  </td>
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
