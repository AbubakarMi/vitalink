import { Star } from "lucide-react";
import type { MockReview } from "@/lib/api/reviews";

/** Figma EZER-KEY node 1591:3657 "SELLER INFO" / node 1591:3661 "Review".
 * Real per-product count (not the design's fabricated "102") and a generic
 * "Verified Customer" attribution instead of the design's fake named reviewer —
 * see lib/api/mocks/reviews.ts for why. */
export function ProductReviews({ reviews }: { reviews: MockReview[] }) {
  return (
    <div className="rounded-2xl bg-white p-10">
      <p className="text-xl text-[#1a4d3e]">Reviews ({reviews.length})</p>
      <hr className="mt-5 border-[#e1e3e4]" />

      {reviews.length === 0 ? (
        <p className="mt-8 text-sm text-text-muted">No reviews yet for this product.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-[#e1e3e4] p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e6f4ea] text-xs font-bold text-[#4a7a4a]">
                  VB
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-[#1a4d3e]">Verified Customer</p>
                  <p className="text-xs text-text-muted">
                    {new Date(review.date)
                      .toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
                      .toUpperCase()}
                  </p>
                </div>
                <div className="ml-auto flex gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`size-4 ${i < review.rating ? "fill-[#ffb400] text-[#ffb400]" : "text-[#e1e3e4]"}`}
                      aria-hidden
                    />
                  ))}
                </div>
              </div>
              <p className="mt-4 text-sm text-[#44474d]">{review.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
