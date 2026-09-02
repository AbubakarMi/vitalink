"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, ShoppingCart, ChevronDown, Star } from "lucide-react";
import type { MarketplaceOfferDetails } from "@/lib/api/marketplace";
import { addToLiveCartAction } from "@/lib/cart/live-actions";

/**
 * The "Buy Box" — one offer (cheapest by default) shown as the primary Add
 * to Cart, with a collapsible list of every other vendor's offer to switch
 * to. No vendor name/identity is shown because the real backend response
 * (MarketplaceOfferDetails) doesn't carry one at all — offers are picked by
 * price/condition/stock, not by seller. Adds to the real backend cart
 * (lib/api/cart.ts), not the mock catalog's localStorage store.
 */
export function BuyBox({ offers, currency }: { offers: MarketplaceOfferDetails[]; currency: string }) {
  const sorted = [...offers].sort((a, b) => a.price - b.price);
  const [selectedId, setSelectedId] = useState(sorted[0]?.offerId);
  const [quantity, setQuantity] = useState(1);
  const [showOthers, setShowOthers] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = sorted.find((o) => o.offerId === selectedId) ?? sorted[0];

  if (!selected) {
    return (
      <div className="rounded-2xl border border-dashed border-line p-5 text-sm text-text-muted">
        No offers are currently available for this product.
      </div>
    );
  }

  const others = sorted.filter((o) => o.offerId !== selected.offerId);
  const symbol = currency === "NGN" ? "N" : `${currency} `;
  const outOfStock = selected.trackInventory && selected.availableQuantity <= 0;

  function addToCart() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await addToLiveCartAction(selected.offerId, quantity);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Added to your cart.");
    });
  }

  return (
    <div className="rounded-2xl border-2 border-ink p-5">
      <div className="flex items-baseline gap-2">
        <span className="font-[family-name:var(--font-newsreader)] text-3xl text-ink">
          {symbol}
          {selected.price.toLocaleString("en-NG")}
        </span>
        {selected.compareAtPrice != null && selected.compareAtPrice > selected.price && (
          <span className="text-sm text-text-muted line-through">
            {symbol}
            {selected.compareAtPrice.toLocaleString("en-NG")}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-text-muted">
        {selected.condition}
        {selected.trackInventory ? ` · ${selected.availableQuantity} in stock` : ""}
      </p>
      {selected.ratingSummary.reviewCount > 0 && (
        <div className="mt-1 flex items-center gap-1 text-xs text-text-muted">
          <Star className="size-3 fill-signal text-signal" aria-hidden />
          {selected.ratingSummary.average.toFixed(1)} ({selected.ratingSummary.reviewCount} reviews)
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-line px-2 py-1.5">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="flex size-7 items-center justify-center rounded-full text-ink-soft hover:bg-mint"
          >
            <Minus className="size-3.5" aria-hidden />
          </button>
          <span className="w-6 text-center text-sm font-medium text-ink">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
            className="flex size-7 items-center justify-center rounded-full text-ink-soft hover:bg-mint"
          >
            <Plus className="size-3.5" aria-hidden />
          </button>
        </div>
        <button
          type="button"
          onClick={addToCart}
          disabled={pending || outOfStock}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85 disabled:opacity-50"
        >
          <ShoppingCart className="size-4" aria-hidden />
          {outOfStock ? "Out of stock" : pending ? "Adding…" : "Add to Cart"}
        </button>
      </div>

      {message && <p className="mt-2 text-xs text-verified">{message}</p>}
      {error && <p className="mt-2 text-xs text-[#c0392b]">{error}</p>}

      {others.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setShowOthers((v) => !v)}
            aria-expanded={showOthers}
            className="flex w-full items-center justify-between text-sm font-medium text-ink-soft hover:text-ink"
          >
            {others.length} other offer{others.length === 1 ? "" : "s"}
            <ChevronDown className={`size-4 shrink-0 transition-transform ${showOthers ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {showOthers && (
            <div className="mt-3 space-y-2">
              {others.map((offer) => (
                <button
                  key={offer.offerId}
                  type="button"
                  onClick={() => {
                    setSelectedId(offer.offerId);
                    setShowOthers(false);
                    setMessage(null);
                    setError(null);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-line px-3.5 py-2.5 text-left text-sm transition-colors hover:border-ink/40"
                >
                  <span>
                    <span className="font-medium text-ink">
                      {symbol}
                      {offer.price.toLocaleString("en-NG")}
                    </span>
                    <span className="ml-2 text-text-muted">{offer.condition}</span>
                  </span>
                  <span className="shrink-0 text-xs text-text-muted">
                    {offer.trackInventory ? `${offer.availableQuantity} in stock` : "In stock"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
