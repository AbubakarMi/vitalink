import Image from "next/image";
import { cn } from "@/lib/utils";

/** Naira-formatted price with the design's icon glyph — Figma EZER-KEY node 1707:7213. */
export function NairaPrice({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[#1a4d3e]", className)}>
      <Image src="/marketing/naira-icon.svg" alt="" width={16} height={16} aria-hidden />
      {amount.toLocaleString("en-NG")}
    </span>
  );
}
