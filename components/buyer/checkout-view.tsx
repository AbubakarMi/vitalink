"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, Landmark, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/store";
import { DELIVERY_FEE } from "@/lib/cart/constants";
import type { DeliveryAddress } from "@/lib/api/buyer-profile";
import type { BuyerOrderItem } from "@/lib/api/buyer-orders";
import { completeCheckoutAction } from "@/app/buyer/checkout/actions";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]";

/** No real payment gateway is wired up (mockup showed "Pay with Paystack",
 * but there's no Paystack integration or backend Payment endpoint) — this
 * form is disclosed as a mock rather than implying real card processing.
 * Client-only (reads the real cart store), split out from page.tsx which
 * keeps the requireAccountType guard as a Server Component. */
export function CheckoutView({ initialAddress }: { initialAddress: DeliveryAddress | null }) {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<"card" | "bank">("card");

  const total = subtotal + DELIVERY_FEE;

  function handleSubmit(formData: FormData) {
    setError(null);
    const address: DeliveryAddress = {
      country: String(formData.get("country") ?? ""),
      state: String(formData.get("state") ?? ""),
      city: String(formData.get("city") ?? ""),
      addressLine: String(formData.get("addressLine") ?? ""),
    };
    const orderItems: BuyerOrderItem[] = items.map((item) => ({
      productId: item.productId,
      name: item.name,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      unitPrice: item.price,
    }));

    startTransition(async () => {
      const result = await completeCheckoutAction(orderItems, address);
      if (result.error || !result.data) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      clearCart();
      router.push(`/buyer/checkout/success?orderId=${result.data.orderId}`);
    });
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-text-muted">Your cart is empty — add something before checking out.</p>
        <Link href="/products" className="mt-4 inline-block rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink/85">
          Browse the catalog
        </Link>
      </div>
    );
  }

  return (
    <form action={handleSubmit}>
      <p className="font-mono text-xs tracking-[0.2em] text-verified uppercase">Secure Checkout</p>
      <h1 className="mt-1 font-[family-name:var(--font-newsreader)] text-3xl text-ink">Complete your order</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <SectionHeading step={1} label="Delivery Address" />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Country" name="country" placeholder="e.g. Nigeria" defaultValue={initialAddress?.country ?? "Nigeria"} required />
              <Field label="State" name="state" placeholder="e.g. Enugu" defaultValue={initialAddress?.state} required />
              <Field label="City" name="city" placeholder="e.g. Enugu" defaultValue={initialAddress?.city} required />
              <Field
                label="Street Address"
                name="addressLine"
                placeholder="e.g. No 12 Nza Street, Independence Layout"
                defaultValue={initialAddress?.addressLine}
                required
                className="sm:col-span-2"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <SectionHeading step={2} label="Payment Method" />
            <div className="mt-4 flex flex-wrap gap-2">
              <MethodTab active={method === "card"} onClick={() => setMethod("card")} icon={CreditCard} label="Credit / Debit Card" />
              <MethodTab active={method === "bank"} onClick={() => setMethod("bank")} icon={Landmark} label="Bank Transfer" />
            </div>

            {method === "card" ? (
              <div className="mt-5 space-y-4">
                <Field label="Cardholder Name" name="cardName" placeholder="As it appears on your card" />
                <Field label="Card Number" name="cardNumber" placeholder="0000 0000 0000 0000" inputMode="numeric" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Expiry Date" name="expiry" placeholder="MM/YY" />
                  <Field label="CVV" name="cvv" placeholder="123" inputMode="numeric" />
                </div>
                <p className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Lock className="size-3.5" aria-hidden />
                  This is a demo checkout — no real card details are transmitted or stored, and no payment is
                  actually processed.
                </p>
              </div>
            ) : (
              <p className="mt-5 text-sm text-text-muted">
                Bank transfer isn&apos;t wired up yet in this preview — use Credit / Debit Card to complete checkout.
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
              {error}
            </p>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-white p-5 sm:p-6">
          <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">Order Summary</p>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-ink-soft">
                  {item.name} <span className="text-text-muted">×{item.quantity}</span>
                </span>
                <span className="shrink-0 text-ink">N{(item.price * item.quantity).toLocaleString("en-NG")}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-text-muted">
              <span>Subtotal</span>
              <span>N{subtotal.toLocaleString("en-NG")}</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Delivery</span>
              <span>N{DELIVERY_FEE.toLocaleString("en-NG")}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-line pt-4 font-semibold text-ink">
            <span>Total Due</span>
            <span>N{total.toLocaleString("en-NG")}</span>
          </div>

          <button
            type="submit"
            disabled={pending || method !== "card"}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85 disabled:opacity-50"
          >
            <Lock className="size-4" aria-hidden />
            {pending ? "Placing order…" : "Complete Payment"}
          </button>

          <div className="mt-4 flex items-center gap-1.5 text-xs text-text-muted">
            <ShieldCheck className="size-3.5 text-verified" aria-hidden />
            NAFDAC-verified vendors only
          </div>
        </aside>
      </div>
    </form>
  );
}

function SectionHeading({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
        {step}
      </span>
      <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">{label}</p>
    </div>
  );
}

function MethodTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof CreditCard;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
        active ? "border-ink bg-mint text-ink" : "border-line text-text-muted hover:border-ink/30",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </button>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  inputMode,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: "numeric" | "text";
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="text-sm font-medium text-ink-soft">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        className={fieldClass}
      />
    </div>
  );
}
