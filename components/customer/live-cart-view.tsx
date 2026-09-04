"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowLeft, ImageOff, X, ShieldCheck, Truck, Loader2 } from "lucide-react";
import type { Cart, CartItem, CheckoutQuote, CheckoutQuoteLine } from "@/lib/api/cart";
import { changeLiveCartQuantityAction, removeLiveCartItemAction, clearLiveCartAction } from "@/lib/cart/live-actions";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { CheckoutCta } from "@/components/customer/checkout-cta";

const ROW_GRID = "sm:grid-cols-[minmax(0,1fr)_110px_120px_110px_36px]";

/**
 * The real, backend-priced cart (lib/api/cart.ts) — used instead of
 * components/customer/cart-view.tsx's localStorage store once
 * PRODUCTS_DATA_SOURCE=live (see app/customer/cart/page.tsx's branch).
 * CartItemResponse carries no price at all; a line's real price only
 * exists via a separate checkout-quote call, merged in here by
 * vendorOfferId — see app/api/cart/route.ts, which this fetches from on
 * mount rather than a page awaiting getCart() directly (that call can mint
 * a fresh guest-cart cookie, which Next.js only allows from a Route
 * Handler/Server Action, never a component's render).
 *
 * isAuthenticated (from app/customer/cart/page.tsx's verifySession(), guest-
 * accessible) decides what the "Proceed to Checkout" CTA does — see
 * components/customer/checkout-cta.tsx.
 */
export function LiveCartView({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setLoadError(data.error);
          return;
        }
        setCart(data.cart);
        setQuote(data.quote ?? null);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load your cart. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateQuantity(itemId: string, quantity: number) {
    if (quantity < 1) return;
    setActionError(null);
    startTransition(async () => {
      const result = await changeLiveCartQuantityAction(itemId, quantity);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      if (result.cart) setCart(result.cart);
    });
  }

  function removeItem(itemId: string) {
    setActionError(null);
    startTransition(async () => {
      const result = await removeLiveCartItemAction(itemId);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      if (result.cart) setCart(result.cart);
    });
  }

  async function clear() {
    const result = await clearLiveCartAction();
    if (result.error) return { error: result.error };
    if (result.cart) setCart(result.cart);
  }

  function lineFor(vendorOfferId: string): CheckoutQuoteLine | undefined {
    return quote?.lines.find((line) => line.vendorOfferId === vendorOfferId);
  }

  if (loading) {
    return (
      <div className="mt-10 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-16 text-sm text-text-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading your cart…
      </div>
    );
  }

  if (loadError && !cart) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-line py-16 text-center text-sm text-[#c0392b]">{loadError}</div>
    );
  }

  const items = cart?.items ?? [];

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
            {actionError && (
              <p className="mb-3 rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">{actionError}</p>
            )}
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
                  <LiveCartRow
                    key={item.id}
                    item={item}
                    line={lineFor(item.vendorOfferId)}
                    disabled={pending}
                    onRemove={() => removeItem(item.id)}
                    onQuantityChange={(q) => updateQuantity(item.id, q)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Link href="/products" className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
                <ArrowLeft className="size-4" aria-hidden />
                Back to Shopping
              </Link>
              <ConfirmActionButton
                onConfirm={clear}
                title="Clear your cart?"
                description="Every item currently in your cart will be removed. This can't be undone."
                confirmLabel="Yes, clear it"
                trigger={
                  <button type="button" className="flex items-center gap-1.5 text-sm font-medium text-[#c0392b] hover:underline">
                    <Trash2 className="size-3.5" aria-hidden />
                    Clear Cart
                  </button>
                }
              />
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-line bg-white p-5">
            <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">Cart Summary</p>
            {quote ? (
              <>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-text-muted">
                    <span>Merchandise</span>
                    <span>N{quote.merchandiseTotal.toLocaleString("en-NG")}</span>
                  </div>
                  {quote.discountTotal > 0 && (
                    <div className="flex justify-between text-verified">
                      <span>Discount</span>
                      <span>-N{quote.discountTotal.toLocaleString("en-NG")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-text-muted">
                    <span>Shipping</span>
                    <span>N{quote.shippingTotal.toLocaleString("en-NG")}</span>
                  </div>
                  {quote.taxTotal > 0 && (
                    <div className="flex justify-between text-text-muted">
                      <span>Tax</span>
                      <span>N{quote.taxTotal.toLocaleString("en-NG")}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-between border-t border-line pt-4 text-base font-semibold text-ink">
                  <span>Total</span>
                  <span>N{quote.grandTotal.toLocaleString("en-NG")}</span>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-text-muted">Pricing will show once your cart finishes loading.</p>
            )}
            <CheckoutCta isAuthenticated={isAuthenticated} />

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

function LiveCartRow({
  item,
  line,
  disabled,
  onRemove,
  onQuantityChange,
}: {
  item: CartItem;
  line: CheckoutQuoteLine | undefined;
  disabled: boolean;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
}) {
  const unitPrice = line?.price.effectiveUnitPrice;
  const lineTotal = line?.price.lineTotal;
  const needsReview = item.status === "NeedsReview";

  return (
    <div className={`grid grid-cols-1 items-center gap-4 p-5 ${ROW_GRID}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-cream">
          {item.primaryImageUrl ? (
            <Image src={item.primaryImageUrl} alt="" fill className="object-contain p-1.5" sizes="56px" />
          ) : (
            <ImageOff className="size-5 text-text-muted" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{item.productName ?? item.sku ?? "Item"}</p>
          {needsReview && <p className="text-xs text-[#c0392b]">No longer available at this quantity/price — please review.</p>}
          {unitPrice !== undefined && (
            <p className="font-mono text-[10px] tracking-[0.1em] text-text-muted uppercase sm:hidden">
              N{unitPrice.toLocaleString("en-NG")} each
            </p>
          )}
        </div>
      </div>

      <div className="hidden text-sm text-ink-soft sm:block">
        {unitPrice !== undefined ? `N${unitPrice.toLocaleString("en-NG")}` : "—"}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onQuantityChange(item.quantity - 1)}
          disabled={disabled || item.quantity <= 1}
          aria-label="Decrease quantity"
          className="flex size-8 items-center justify-center rounded-full border border-line text-ink-soft hover:border-ink/40 disabled:opacity-40"
        >
          <Minus className="size-3.5" aria-hidden />
        </button>
        <span className="w-6 text-center text-sm font-medium text-ink">{item.quantity}</span>
        <button
          type="button"
          onClick={() => onQuantityChange(item.quantity + 1)}
          disabled={disabled}
          aria-label="Increase quantity"
          className="flex size-8 items-center justify-center rounded-full border border-line text-ink-soft hover:border-ink/40 disabled:opacity-40"
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>

      <p className="text-sm font-semibold text-ink">{lineTotal !== undefined ? `N${lineTotal.toLocaleString("en-NG")}` : "—"}</p>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${item.productName ?? "item"}`}
        className="flex size-8 items-center justify-center justify-self-end rounded-full text-text-muted hover:bg-[#fff0ee] hover:text-[#c0392b] disabled:opacity-40 sm:justify-self-auto"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
