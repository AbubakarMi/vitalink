import { requireAccountType } from "@/lib/auth/dal";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Mocked — no Product API yet (design doc §1). Placeholder — UI comes later. */
export default async function EditVendorProductPage({ params }: PageProps) {
  await requireAccountType("vendor", "/vendor/products");
  const { id } = await params;

  return (
    <main>
      <h1>Edit product {id}</h1>
      <p>No Product API yet — placeholder.</p>
    </main>
  );
}
