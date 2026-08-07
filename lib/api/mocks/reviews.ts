export interface MockReview {
  id: string;
  productId: string;
  rating: number;
  date: string;
  body: string;
}

// Figma EZER-KEY node 1591:3661/3682 shows two review cards attributed to a
// specific named person ("Adejumoke Tejuosho") with a Lorem Ipsum body — that
// name is Figma placeholder, not a real reviewer, and attributing invented
// testimony to a specific person would be fabricated social proof (design
// doc §1). Kept the Lorem Ipsum body (a universally recognized placeholder,
// not deceptive on its own) but the product detail page renders it under a
// generic "Verified Buyer" label instead of a fake identity, and shows the
// real per-product review count rather than the design's fabricated "102".
const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed neque erat, porta vel malesuada vitae, consequat id turpis. Donec ut suscipit augue, sit amet fringilla augue. Integer quis ligula eget magna vehicula volutpat.";

export const mockReviews: MockReview[] = [
  { id: "rev_contec_1", productId: "prod_contec-cms8000", rating: 5, date: "2026-09-12", body: LOREM },
  { id: "rev_contec_2", productId: "prod_contec-cms8000", rating: 4, date: "2026-08-30", body: LOREM },
  { id: "rev_ohaus_1", productId: "prod_ohaus-ex224", rating: 5, date: "2026-09-01", body: LOREM },
];
