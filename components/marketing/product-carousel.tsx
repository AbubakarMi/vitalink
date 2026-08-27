"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/marketing/product-card";
import type { Product } from "@/lib/api/products";

const AUTO_SCROLL_PX_PER_SEC = 26;
/** Only the arrow buttons and drag/touch use this cooldown — those are a
 * manual scroll gesture the auto-crawl shouldn't immediately fight. A plain
 * mouse hover resumes the instant the pointer leaves (see onMouseLeave). */
const GESTURE_RESUME_DELAY_MS = 2000;

/**
 * Horizontal carousel for the landing page's Featured section — continuously
 * drifts on its own (a gentle, "live" crawl, not a scroll-snap-and-stop
 * carousel) via requestAnimationFrame nudging the track's native scrollLeft,
 * so drag/swipe and the arrow buttons stay real browser scrolling rather
 * than a CSS-transform trick. The product list is rendered twice back-to-
 * back so the auto-scroll can wrap seamlessly (reset scrollLeft by exactly
 * one copy's width — identical content on both sides, so the jump is
 * invisible), the same technique as the Trusted Brands logo marquee.
 *
 * Hovering pauses it immediately; moving the pointer away resumes it
 * immediately too. Dragging/touching or clicking an arrow pauses it and
 * waits a couple seconds before resuming, so the auto-crawl doesn't yank
 * the track out from under an in-progress gesture. Skipped entirely under
 * prefers-reduced-motion.
 */
export function ProductCarousel({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const track2x = [...products, ...products];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function updateScrollable() {
      if (!track) return;
      setScrollable(track.scrollWidth > track.clientWidth + 1);
    }

    updateScrollable();
    window.addEventListener("resize", updateScrollable);
    return () => window.removeEventListener("resize", updateScrollable);
  }, [products]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || products.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame: number;
    let last = performance.now();

    function step(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      if (!pausedRef.current && track) {
        const halfWidth = track.scrollWidth / 2;
        track.scrollLeft += AUTO_SCROLL_PX_PER_SEC * dt;
        if (track.scrollLeft >= halfWidth) {
          track.scrollLeft -= halfWidth;
        }
      }
      frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [products]);

  function clearResumeTimer() {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }

  function pause() {
    pausedRef.current = true;
    clearResumeTimer();
  }

  function resumeNow() {
    clearResumeTimer();
    pausedRef.current = false;
  }

  function resumeAfterGesture() {
    clearResumeTimer();
    resumeTimeoutRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, GESTURE_RESUME_DELAY_MS);
  }

  function scrollByCards(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    pause();
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: "smooth" });
    resumeAfterGesture();
  }

  return (
    <div className="relative">
      {scrollable && (
        <div className="mb-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            aria-label="Previous products"
            className="flex size-9 items-center justify-center rounded-full border border-line bg-white text-ink-soft shadow-sm transition-colors hover:border-verified hover:text-verified"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            aria-label="Next products"
            className="flex size-9 items-center justify-center rounded-full border border-line bg-white text-ink-soft shadow-sm transition-colors hover:border-verified hover:text-verified"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      )}

      <div className="[mask-image:linear-gradient(to_right,transparent,black_2%,black_97%,transparent)]">
        <div
          ref={trackRef}
          onMouseEnter={pause}
          onMouseLeave={resumeNow}
          onPointerDown={pause}
          onPointerUp={resumeAfterGesture}
          onFocus={pause}
          onBlur={resumeAfterGesture}
          className="no-scrollbar flex gap-5 overflow-x-auto py-1 pl-1"
        >
          {track2x.map((product, i) => (
            <div key={`${product.id}-${i}`} className="w-64 shrink-0 sm:w-72">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
