"use client";

import { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { useCart } from "@/lib/cart/store";
import type { Product } from "@/lib/api/products";

/** Real add-to-cart (lib/cart/store.tsx) — no backend Cart API exists yet
 * (design doc §1), so this is client-only state, not a fake button. */
export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleClick() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      currency: product.currency,
      imageUrl: product.imageUrl,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Add ${product.name} to cart`}
      className="flex items-center justify-center rounded-[5px] border-2 border-verified bg-verified px-5 py-2 transition-colors hover:bg-brand-primary-hover"
    >
      {justAdded ? (
        <Check className="size-5 text-white" aria-hidden />
      ) : (
        <Image src="/marketplace/add-to-cart-icon.svg" alt="" width={20} height={20} aria-hidden />
      )}
    </button>
  );
}
