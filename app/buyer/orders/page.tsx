import Image from "next/image";
import Link from "next/link";
import { Search, ImageOff } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { listOrdersForBuyer, type BuyerOrderStatus } from "@/lib/api/buyer-orders";
import { StatusPill } from "@/components/buyer/status-pill";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

const PAGE_SIZE = 8;
const STATUS_FILTERS: { value: BuyerOrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Processing", label: "Processing" },
  { value: "Shipped", label: "Shipped" },
  { value: "Delivered", label: "Delivered" },
  { value: "Cancelled", label: "Cancelled" },
];

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

/** Matches Frame 2018776196.pdf's "Order History" (the buyer sidebar's
 * "History" tab, not a separate route named /history). */
export default async function BuyerOrdersPage({ searchParams }: PageProps) {
  // ["Vendor"]: a vendor shopping the marketplace has their own purchase
  // history here too — see lib/auth/route-groups.ts's isBuyerPathOpenToVendors.
  await requireAccountType("buyer", "/buyer/orders", ["Vendor"]);
  const params = await searchParams;
  const orders = await listOrdersForBuyer();

  const query = (params.q ?? "").trim().toLowerCase();
  const statusFilter = (params.status ?? "all") as BuyerOrderStatus | "all";
  const filtered = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (query && !order.id.toLowerCase().includes(query)) return false;
    return true;
  });

  const page = Math.max(1, Number(params.page) || 1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-verified uppercase">History</p>
          <h1 className="mt-1 font-[family-name:var(--font-newsreader)] text-3xl text-ink">Order History</h1>
        </div>
        <form className="flex flex-col gap-2 sm:flex-row" method="get">
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
              className="w-full rounded-xl border border-line bg-white py-2.5 pr-3 pl-10 text-sm text-ink outline-none focus:border-ink/40 sm:w-56"
            />
          </div>
        </form>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-line py-16 text-center">
          <p className="text-sm text-text-muted">{orders.length === 0 ? "No orders yet." : "No orders match your search/filter."}</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-cream/60 font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">
                <tr>
                  <th className="px-5 py-3 font-medium">Order Item</th>
                  <th className="px-5 py-3 font-medium">Date of Order</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((order) => {
                  const firstItem = order.items[0];
                  return (
                    <tr key={order.id} className="border-b border-line/70 last:border-b-0 hover:bg-cream/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-cream">
                            {firstItem?.imageUrl ? (
                              <Image src={firstItem.imageUrl} alt="" fill className="object-contain p-1" sizes="44px" />
                            ) : (
                              <ImageOff className="size-4 text-text-muted" aria-hidden />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">
                              {firstItem?.name}
                              {order.items.length > 1 && ` +${order.items.length - 1} more`}
                            </p>
                            {firstItem?.sku && <p className="text-xs text-text-muted">SKU: {firstItem.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-text-muted">
                        {new Date(order.placedAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                        <span className="block text-xs">
                          {new Date(order.placedAt).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-ink">N{order.total.toLocaleString("en-NG")}</td>
                      <td className="px-5 py-4">
                        <StatusPill status={order.status} />
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/buyer/orders/${order.id}`} className="font-medium text-verified hover:text-ink">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-5 py-4 sm:flex-row">
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
      )}
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
    return <span className="cursor-not-allowed rounded-lg border border-line px-3 py-1.5 text-sm text-text-muted/50">{children}</span>;
  }
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  query.set("page", String(page));
  return (
    <Link href={`/buyer/orders?${query.toString()}`} className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:border-ink/40">
      {children}
    </Link>
  );
}
