import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { getAdminTransactionDetails } from "@/lib/api/admin/transactions";
import { StatusPill } from "@/components/admin/status-pill";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

const TYPE_TONE: Record<string, "success" | "danger" | "info"> = {
  "Order Revenue": "success",
  "Vendor Payout": "info",
  "Admin Credit": "info",
  "Failed Payout": "danger",
};

/** No backend Transactions API yet — mock-only, see lib/api/admin/transactions.ts. */
export default async function AdminTransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAccountType("admin", "/admin/transactions");
  const { id } = await params;
  const txn = await getAdminTransactionDetails(id).catch(() => null);

  if (!txn) {
    return (
      <main className="mx-auto max-w-xl space-y-6">
        <Link href="/admin/transactions" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden />
          Back to Transactions
        </Link>
        <p className="rounded-2xl border border-line bg-white px-8 py-14 text-center text-sm text-text-muted">
          This transaction couldn&apos;t be loaded.
        </p>
      </main>
    );
  }

  const isDebit = txn.type === "Vendor Payout" || txn.type === "Failed Payout";
  const tone = TYPE_TONE[txn.type] ?? "info";
  const amountClass = tone === "danger" ? "text-[#c0392b]" : tone === "success" ? "text-verified" : "text-ink";

  return (
    <main className="mx-auto max-w-xl space-y-6">
      <Link href="/admin/transactions" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Back to Transactions
      </Link>

      <div className="rounded-2xl border border-line bg-white p-8 shadow-[0_8px_30px_rgba(0,39,8,0.06)]">
        <div className="flex items-start justify-between border-b border-line pb-6">
          <div>
            <p className="font-alata text-xl tracking-tight text-ink">VITALINK</p>
            <p className="mt-1 text-sm text-text-muted">Platform Transaction Record</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium tracking-wide text-text-muted uppercase">Transaction</p>
            <p className="font-mono text-sm text-ink">{txn.transactionId}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl bg-cream px-5 py-4">
          <span className="text-sm font-medium text-ink-soft">{txn.type}</span>
          <span className={`font-[family-name:var(--font-newsreader)] text-3xl ${amountClass}`}>
            {isDebit ? "−" : "+"}N{txn.amount.toLocaleString("en-NG")}
          </span>
        </div>

        <div className="mt-6 space-y-4">
          <Row label="Status" value={<StatusPill status={txn.status} />} />
          <Row
            label="Date & time"
            value={new Date(txn.createdAt).toLocaleString("en-NG", { dateStyle: "long", timeStyle: "short" })}
          />
          <Row label="Reference" value={<span className="font-mono text-xs">{txn.reference}</span>} />
          {txn.paymentMethod && <Row label="Payment method" value={txn.paymentMethod} />}
          {txn.vendorName && <Row label="Vendor" value={txn.vendorName} />}
          {txn.customerName && <Row label="Customer" value={txn.customerName} />}
        </div>

        {txn.note && (
          <div className="mt-6 rounded-xl bg-[#fff7e6] px-4 py-3">
            <p className="text-xs font-semibold tracking-wide text-[#a15c00] uppercase">Note</p>
            <p className="mt-1 text-sm text-[#a15c00]">{txn.note}</p>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-text-muted">
          This record is for internal platform reconciliation and is not a tax invoice.
        </p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
