import { requireAccountType } from "@/lib/auth/dal";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Mocked — no Product API yet (design doc §1). Placeholder — UI comes later. */
export default async function VendorProductsPage() {
  await requireAccountType("vendor", "/vendor/products");
  return (
    <main>
      <h1>My products</h1>
      <p>No Product API yet — placeholder.</p>
    </main>
  );
}
