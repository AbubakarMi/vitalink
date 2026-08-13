"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowLeft, ImageOff, X, ShieldCheck, Truck } from "lucide-react";
import { useCart, type CartItem } from "@/lib/cart/store";
import { DELIVERY_FEE } from "@/lib/cart/constants";

const ROW_GRID = "sm:grid-cols-[minmax(0,1fr)_110px_120px_110px_36px]";

/** Rebuilt on the real client-side cart store (lib/cart/store.tsx) — the
 * page previously read a static server-mocked fixture that had nothing to
 * do with what add-to-cart buttons across the site actually write to.
 * Client-only (useCart needs the browser) — split out from app/buyer/cart/
 * page.tsx so that page.tsx can stay a Server Component and keep calling
 * requireAccountType() itself (defense-in-depth convention, frontend
 * architecture doc §2.2) rather than relying only on the layout's check.
 * Laid out as a manifest (column-headed line items) rather than a loose
 * stack of cards — the audience is a procurement buyer, not a casual
 * shopper, so the cart should read like an itemized order, not a basket. */
export function CartView() {
  const { items, subtotal, removeItem, setQuantity, clearCart } = useCart();
  const total = items.length > 0 ? subtotal + DELIVERY_FEE : 0;

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-verified uppercase">Requisition Cart</p>
      <h1 className="mt-1 font-[family-name:var(--font-newsreader)] text-3xl text-ink">
        {items.length === 0 ? "Your cart" : `${items.length} item${items.length === 1 ? "" : "s"} in cart`}
      </h1>

      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-line py-16 text-center">
          <p className="text-sm text-text-muted">Your cart is empty.</p>
          <Link href="/products" className="mt-4 rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink/85">
            Browse the catalog
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              <div
                className={`hidden items-center gap-4 border-b border-line bg-cream/60 px-5 py-3 font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase sm:grid ${ROW_GRID}`}
              >
                <span>Item</span>
                <span>Unit Price</span>
                <span>Quantity</span>
                <span>Total</span>
                <span />
              </div>
              <div className="divide-y divide-line">
                {items.map((item) => (
                  <CartRow key={item.productId} item={item} onRemove={() => removeItem(item.productId)} onQuantityChange={(q) => setQuantity(item.productId, q)} />
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Link href="/products" className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
                <ArrowLeft className="size-4" aria-hidden />
                Back to Shopping
              </Link>
              <button type="button" onClick={clearCart} className="flex items-center gap-1.5 text-sm font-medium text-[#c0392b] hover:underline">
                <Trash2 className="size-3.5" aria-hidden />
                Clear Cart
              </button>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-line bg-white p-5">
            <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">Cart Summary</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Sub-total</span>
                <span>N{subtotal.toLocaleString("en-NG")}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Delivery</span>
                <span>N{DELIVERY_FEE.toLocaleString("en-NG")}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-line pt-4 text-base font-semibold text-ink">
              <span>Total</span>
              <span>N{total.toLocaleString("en-NG")}</span>
            </div>
            <Link
              href="/buyer/checkout"
              className="mt-5 flex w-full items-center justify-center rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85"
            >
              Proceed to Checkout
            </Link>

            <div className="mt-5 space-y-2 border-t border-line pt-4 text-xs text-text-muted">
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-verified" aria-hidden />
                NAFDAC-verified vendors only
              </p>
              <p className="flex items-center gap-1.5">
                <Truck className="size-3.5 text-verified" aria-hidden />
                Delivery tracked from dispatch
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function CartRow({
  item,
  onRemove,
  onQuantityChange,
}: {
  item: CartItem;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
}) {
  return (
    <div className={`grid grid-cols-1 items-center gap-4 p-5 ${ROW_GRID}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-cream">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt="" fill className="object-contain p-1.5" sizes="56px" />
          ) : (
            <ImageOff className="size-5 text-text-muted" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <Link href={`/products/${item.slug}`} className="block truncate font-medium text-ink hover:text-verified">
            {item.name}
          </Link>
          <p className="font-mono text-[10px] tracking-[0.1em] text-text-muted uppercase sm:hidden">
            N{item.price.toLocaleString("en-NG")} each
          </p>
        </div>
      </div>

      <div className="hidden text-sm text-ink-soft sm:block">N{item.price.toLocaleString("en-NG")}</div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onQuantityChange(item.quantity - 1)}
          aria-label="Decrease quantity"
          className="flex size-8 items-center justify-center rounded-full border border-line text-ink-soft hover:border-ink/40"
        >
          <Minus className="size-3.5" aria-hidden />
        </button>
        <span className="w-6 text-center text-sm font-medium text-ink">{item.quantity}</span>
        <button
          type="button"
          onClick={() => onQuantityChange(item.quantity + 1)}
          aria-label="Increase quantity"
          className="flex size-8 items-center justify-center rounded-full border border-line text-ink-soft hover:border-ink/40"
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>

      <p className="text-sm font-semibold text-ink">N{(item.price * item.quantity).toLocaleString("en-NG")}</p>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${item.name}`}
        className="flex size-8 items-center justify-center rounded-full text-text-muted hover:bg-[#fff0ee] hover:text-[#c0392b] justify-self-end sm:justify-self-auto"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
