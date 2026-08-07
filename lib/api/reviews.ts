import "server-only";
import { mockReviews, type MockReview } from "./mocks/reviews";

export type { MockReview };

const SOURCE = process.env.PRODUCTS_DATA_SOURCE ?? "mock";

/** No Reviews API exists on the backend yet (design doc §1) — mocked, same
 * data-source seam as lib/api/products.ts. */
export async function listReviewsForProduct(productId: string): Promise<MockReview[]> {
  "use cache";
  if (SOURCE === "live") {
    return [];
  }
  return mockReviews.filter((review) => review.productId === productId);
}
