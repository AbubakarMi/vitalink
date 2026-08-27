"use client";

import { useState } from "react";
import { Minus, Plus, Check, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart/store";
import type { Product } from "@/lib/api/products";

/**
 * Figma EZER-KEY node 1591:3593 "Quantity Adjuster" shows only a stepper
 * (defaulting to "6" — a Figma demo value implying items already selected,
 * not a real default; starts at 1 here) with no visible Add to Cart action
 * nearby. A detail page needs a real way to add N units to the cart, so one
 * is added here (design doc's precedent: fill functional gaps the design
 * doesn't show, don't leave the page non-functional).
 */
export function QuantityAddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  function handleAddToCart() {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        currency: product.currency,
        imageUrl: product.imageUrl,
      },
      quantity,
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setQuantity((q) => q + 1)}
          aria-label="Increase quantity"
          className="flex size-[50px] items-center justify-center rounded-full bg-[#1a4d3e] text-white"
        >
          <Plus className="size-5" aria-hidden />
        </button>
        <span className="w-10 text-center text-[32px] text-[#1a4d3e]">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          aria-label="Decrease quantity"
          disabled={quantity <= 1}
          className="flex size-11 items-center justify-center rounded-full border-2 border-[#1a4d3e] text-[#1a4d3e] disabled:opacity-40"
        >
          <Minus className="size-5" aria-hidden />
        </button>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!product.inStock}
        className="flex items-center gap-2 rounded-[5px] border-2 border-verified bg-verified px-6 py-3 font-bold text-white transition-colors hover:border-verified-hover hover:bg-verified-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {justAdded ? (
          <>
            <Check className="size-5" aria-hidden />
            Added
          </>
        ) : product.inStock ? (
          <>
            <ShoppingCart className="size-5" aria-hidden />
            Add to Cart
          </>
        ) : (
          "Out of Stock"
        )}
      </button>
    </div>
  );
}
