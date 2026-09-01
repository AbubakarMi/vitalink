import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ImageOff, Mail, Phone } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { getAdminBuyerDetails } from "@/lib/api/admin/buyers";
import { StatusPill } from "@/components/admin/status-pill";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBuyerDetailPage({ params }: PageProps) {
  await requireAccountType("admin", "/admin/buyers");
  const { id } = await params;
  const details = await getAdminBuyerDetails(id);
  if (!details) notFound();
  const { buyer, orders } = details;

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/buyers" className="text-sm font-medium text-text-muted hover:text-ink">
        ← Buyers
      </Link>

      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{buyer.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5" aria-hidden />
              {buyer.email}
            </span>
            {buyer.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5" aria-hidden />
                {buyer.phone}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-6">
          <Stat label="Orders" value={String(buyer.orderCount)} />
          <Stat label="Total Spent" value={`N${buyer.totalSpent.toLocaleString("en-NG")}`} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-ink">Order History</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">This buyer hasn&apos;t placed any orders yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-text-muted">{order.id}</p>
                    <p className="mt-0.5 text-sm text-text-muted">
                      {new Date(order.placedAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={order.status} />
                    <span className="font-[family-name:var(--font-newsreader)] text-lg text-ink">
                      N{order.total.toLocaleString("en-NG")}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-line pt-4">
                  {order.items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-cream">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt="" fill className="object-contain p-1" sizes="40px" />
                        ) : (
                          <ImageOff className="size-3.5 text-text-muted" aria-hidden />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                        <p className="text-xs text-text-muted">
                          Qty {item.quantity} × N{item.unitPrice.toLocaleString("en-NG")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-line pt-3 text-xs text-text-muted">
                  Delivered to {order.deliveryAddress.addressLine}, {order.deliveryAddress.city},{" "}
                  {order.deliveryAddress.state}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-xs font-medium tracking-wide text-text-muted uppercase">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-newsreader)] text-xl text-ink">{value}</p>
    </div>
  );
}
