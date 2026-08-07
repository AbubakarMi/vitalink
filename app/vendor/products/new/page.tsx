import { requireAccountType } from "@/lib/auth/dal";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Mocked — no Product API yet (design doc §1). Placeholder — UI comes later. */
export default async function NewVendorProductPage() {
  await requireAccountType("vendor", "/vendor/products/new");
  return (
    <main>
      <h1>New product</h1>
      <p>No Product API yet — placeholder.</p>
    </main>
  );
}
