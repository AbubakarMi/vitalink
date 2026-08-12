import { requireAccountType } from "@/lib/auth/dal";
import { NewProductWizard } from "./new-product-wizard";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** The 4-step New Product wizard (Categorization/Identification/Tech
 * Specifications/Verification) — design doc §5. Mocked (design doc §1). */
export default async function NewVendorProductPage() {
  await requireAccountType("vendor", "/vendor/products/new");
  return <NewProductWizard />;
}
