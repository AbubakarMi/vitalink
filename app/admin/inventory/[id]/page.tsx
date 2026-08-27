import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Truck, ChevronRight } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { getAdminProductDetails } from "@/lib/api/admin/products";
import { StatusPill } from "@/components/admin/status-pill";
import { ProductModerationActions } from "@/components/admin/product-moderation-actions";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Real endpoint (GetProductDetails), shape unconfirmed — see lib/api/admin/products.ts. */
export default async function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAccountType("admin", "/admin/inventory");
  const { id } = await params;
  const product = await getAdminProductDetails(id).catch(() => null);

  if (!product) {
    return (
      <main className="mx-auto max-w-5xl space-y-6">
        <Link href="/admin/inventory" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden />
          Back to Global Inventory
        </Link>
        <p className="rounded-2xl border border-line bg-white px-8 py-14 text-center text-sm text-text-muted">
          This product couldn&apos;t be loaded.
        </p>
      </main>
    );
  }

  const isDecided = product.status === "Active" || product.status === "Rejected";
  const specTabs = [
    { label: "Technical Specs", items: product.technicalSpecs ?? [] },
    { label: "Included Accessories", items: (product.includedAccessories ?? []).map((a) => ({ label: null, value: a })) },
    { label: "Clinical Use Cases", items: (product.clinicalUseCases ?? []).map((c) => ({ label: null, value: c })) },
  ].filter((tab) => tab.items.length > 0);

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-1.5 text-sm text-text-muted">
        <Link href="/admin/inventory" className="flex items-center gap-1.5 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden />
          Global Inventory
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="truncate text-ink-soft">{product.name}</span>
      </div>

      {/* Hero card — full width, so the two-column grid below always starts
       * with both columns at the same top edge regardless of this card's
       * own height. */}
      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="relative aspect-square w-full shrink-0 rounded-xl bg-surface-muted sm:w-56">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt="" fill sizes="224px" className="object-contain p-6" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-text-muted">No image</div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={product.status} />
              {product.badge && (
                <span className="rounded-full bg-mint px-2.5 py-1 text-[10px] font-medium text-verified">{product.badge}</span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-ink">{product.name}</h1>
            {product.sku && <p className="mt-1 text-sm text-text-muted">SKU: {product.sku}</p>}
            {product.shortDescription && <p className="mt-3 text-sm text-ink-soft">{product.shortDescription}</p>}

            <div className="mt-4 flex flex-wrap items-baseline gap-2">
              <span className="font-[family-name:var(--font-newsreader)] text-2xl text-ink">
                N{product.price.toLocaleString("en-NG")}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-text-muted line-through">N{product.originalPrice.toLocaleString("en-NG")}</span>
              )}
            </div>

            {product.freeDelivery && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-verified">
                <Truck className="size-3.5" aria-hidden />
                Free delivery
              </p>
            )}

            {!isDecided && (
              <div className="mt-auto pt-6">
                <ProductModerationActions productId={product.id} />
              </div>
            )}
          </div>
        </div>

        {product.rejectionReason && (
          <div className="mt-6 rounded-xl bg-[#fff0ee] px-4 py-3">
            <p className="text-xs font-semibold tracking-wide text-[#c0392b] uppercase">Rejection reason</p>
            <p className="mt-1 text-sm text-[#c0392b]">{product.rejectionReason}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        {specTabs.length > 0 ? (
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="space-y-6">
              {specTabs.map((tab) => (
                <div key={tab.label}>
                  <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">{tab.label}</p>
                  {tab.items[0]?.label ? (
                    <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {tab.items.map((item) => (
                        <div key={item.label ?? item.value}>
                          <dt className="text-[11px] text-text-muted">{item.label}</dt>
                          <dd className="mt-0.5 text-sm text-ink">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-soft">
                      {tab.items.map((item) => (
                        <li key={item.value}>{item.value}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-white px-6 py-10 text-center text-sm text-text-muted">
            No additional specs, accessories, or clinical use cases on file for this product.
          </div>
        )}

        {/* Side column */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">Details</p>
            <dl className="mt-3 space-y-3 text-sm">
              <DetailRow label="Brand" value={product.brand} />
              <DetailRow label="Category" value={product.categoryLabel} />
              <DetailRow label="Made in" value={product.manufacturedIn} icon={MapPin} />
              <DetailRow label="Stock" value={product.stock !== null && product.stock !== undefined ? String(product.stock) : null} />
              <DetailRow
                label="Low stock threshold"
                value={product.lowStockThreshold !== null && product.lowStockThreshold !== undefined ? String(product.lowStockThreshold) : null}
              />
            </dl>
          </div>

          {product.vendorName && (
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">Listed by</p>
              <p className="mt-2 font-medium text-ink">{product.vendorName}</p>
              {product.vendorId && (
                <Link
                  href={`/admin/vendors/${product.vendorId}`}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-line py-2 text-xs font-medium text-ink-soft hover:bg-cream"
                >
                  View vendor profile
                  <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function DetailRow({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: typeof MapPin }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-text-muted">
        {Icon && <Icon className="size-3.5" aria-hidden />}
        {label}
      </dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
