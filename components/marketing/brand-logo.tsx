import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Renders the brand's real downloaded logo (lib/marketing/brand-logos.ts,
 * public/marketing/brands/) when one exists — grayscale and slightly muted
 * by default, full color on hover. Falls back to the brand's plain name as
 * a tracked-out wordmark (no box, no icon) for any brand no logo file was
 * found for, so a minimal "logo strip" reads as one consistent set instead
 * of switching between two different visual styles mid-row.
 */
export function BrandLogo({ name, src, className }: { name: string; src?: string; className?: string }) {
  if (src) {
    return (
      <span className={cn("relative flex h-8 w-28 shrink-0 items-center", className)}>
        <Image
          src={src}
          alt={name}
          fill
          sizes="112px"
          className="object-contain object-left opacity-60 grayscale transition-all duration-200 group-hover/logo:opacity-100 group-hover/logo:grayscale-0"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex h-8 shrink-0 items-center text-sm font-semibold tracking-wide text-ink-soft/45 uppercase transition-colors duration-200 group-hover/logo:text-ink-soft",
        className,
      )}
    >
      {name}
    </span>
  );
}
