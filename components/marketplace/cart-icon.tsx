"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart/store";

/** Real cart count from the client-side store (lib/cart/store.tsx) — the
 * design's hardcoded "85" was Figma placeholder data. */
export function CartIcon() {
  const { itemCount } = useCart();

  return (
    <Link href="/buyer/cart" aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`} className="relative">
      <span className="flex size-10 items-center justify-center rounded-[10px] bg-verified">
        <Image src="/marketplace/cart-icon.svg" alt="" width={18} height={18} className="invert" aria-hidden />
      </span>
      {itemCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-brand-primary shadow">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
