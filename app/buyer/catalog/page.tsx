import { requireAccountType } from "@/lib/auth/dal";
import { listProducts } from "@/lib/api/products";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Authenticated/personalized catalog — mocked products (design doc §1, §9). */
export default async function BuyerCatalogPage() {
  await requireAccountType("buyer", "/buyer/catalog");
  const products = await listProducts();

  return (
    <main>
      <h1>Catalog</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </main>
  );
}
