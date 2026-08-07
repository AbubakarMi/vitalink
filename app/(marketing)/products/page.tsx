import { listProducts } from "@/lib/api/products";

/** Public catalog browse — mocked products (design doc §1, §9). UI comes later. */
export default async function PublicCatalogPage() {
  const products = await listProducts();

  return (
    <main>
      <h1>Shop health products</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <a href={`/products/${product.slug}`}>{product.name}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
