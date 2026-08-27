"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart/store";

/** Real cart count from the client-side store (lib/cart/store.tsx) — the
 * design's hardcoded "85" was Figma placeholder data. */
export function CartIcon() {
  const { itemCount } = useCart();

  return (
    <Link href="/buyer/cart" aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`} className="relative flex size-10 items-center justify-center">
      <ShoppingCart className="size-6 text-ink" aria-hidden />
      {itemCount > 0 && (
        <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-verified text-[9px] font-bold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
