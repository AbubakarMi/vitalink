import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { getBuyerOrderById } from "@/lib/api/buyer-orders";
import { VitalsStatusTrace } from "@/components/buyer/vitals-status-trace";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

const STAGES = ["Pending", "Processing", "Shipped", "Delivered"];

/** Matches Desktop - 34.pdf's "Order Placed!" screen, extended with the
 * order's own vitals-trace readout so the confirmation moment already shows
 * where the order sits, not just a static checkmark. Open to Vendor sessions
 * too (route-groups.ts's isBuyerPathOpenToVendors) — the post-checkout links
 * below route a vendor to their own dashboard instead, since /buyer/orders
 * and /buyer/dashboard stay Customer-only. */
export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const session = await requireAccountType("buyer", "/buyer/checkout", ["Vendor"]);
  const isVendor = session.accountType === "Vendor";
  const { orderId } = await searchParams;
  const order = orderId ? await getBuyerOrderById(orderId) : null;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <span className="relative flex size-14 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-2xl bg-ink/40" aria-hidden />
        <span className="relative flex size-14 items-center justify-center rounded-2xl bg-ink text-white">
          <CheckCheck className="size-7" aria-hidden />
        </span>
      </span>

      <p className="mt-6 font-mono text-xs tracking-[0.2em] text-verified uppercase">Requisition Confirmed</p>
      <h1 className="mt-2 font-[family-name:var(--font-newsreader)] text-3xl text-ink">Order Placed</h1>
      <p className="mt-2 text-sm text-text-muted">We&apos;ve logged your order and will begin processing it shortly.</p>
      {order && <p className="mt-2 font-mono text-xs text-text-muted">{order.id}</p>}

      {order && (
        <div className="mt-8 w-full rounded-2xl border border-line bg-white px-6 py-5">
          <VitalsStatusTrace stages={STAGES} currentIndex={0} />
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {order && !isVendor && (
          <Link
            href={`/buyer/orders/${order.id}`}
            className="rounded-xl border border-line px-6 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-ink/40"
          >
            View Order
          </Link>
        )}
        <Link
          href={isVendor ? "/vendor/dashboard" : "/buyer/dashboard"}
          className="rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-ink/85"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
