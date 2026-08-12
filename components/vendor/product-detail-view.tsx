"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Sparkles, Trash2, CheckCheck, PackagePlus, Archive, ImageOff, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/api/products";
import type { MockReview } from "@/lib/api/reviews";
import { StatusPill } from "./status-pill";

/**
 * One component branching on product.status rather than two separate pages
 * (design doc §6) — the mockups showed two incompatible "view a product"
 * treatments (a compact draft-review card vs. a full public-style page with
 * spec tabs and reviews); this reconciles them as two states of one screen.
 */

const DRAFT_STATUSES = new Set(["PendingReview", "Rejected"]);

export function ProductDetailView({
  product,
  reviews,
  onPublish,
  onRegenerate,
  onDelete,
  onArchive,
  onRestock,
}: {
  product: Product;
  reviews: MockReview[];
  onPublish: () => Promise<void>;
  onRegenerate: () => Promise<void>;
  onDelete: () => Promise<void>;
  onArchive: () => Promise<void>;
  onRestock: (formData: FormData) => Promise<void>;
}) {
  const isDraft = DRAFT_STATUSES.has(product.status ?? "PendingReview");
  const draftReady = Boolean(product.shortDescription && product.technicalSpecs?.length);

  return (
    <div>
      <Link href="/vendor/products" className="text-sm font-medium text-text-muted hover:text-ink">
        ← Global Inventory
      </Link>

      {isDraft ? (
        <DraftProductView product={product} draftReady={draftReady} onPublish={onPublish} onRegenerate={onRegenerate} onDelete={onDelete} />
      ) : (
        <PublishedProductView product={product} reviews={reviews} onArchive={onArchive} onRestock={onRestock} />
      )}
    </div>
  );
}

function ProductImage({ product, className }: { product: Product; className?: string }) {
  return (
    <span className={cn("flex items-center justify-center overflow-hidden rounded-2xl border border-line bg-cream", className)}>
      {product.imageUrl ? (
        <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-4" sizes="320px" />
      ) : (
        <ImageOff className="size-8 text-text-muted" aria-hidden />
      )}
    </span>
  );
}

function DraftProductView({
  product,
  draftReady,
  onPublish,
  onRegenerate,
  onDelete,
}: {
  product: Product;
  draftReady: boolean;
  onPublish: () => Promise<void>;
  onRegenerate: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  return (
    <div className="mt-4">
      <h1 className="text-2xl font-semibold text-ink">{product.name || "Draft product"}</h1>
      <p className="mt-1 text-sm text-text-muted">Confirm the information for your product and publish it to the marketplace.</p>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <div>
          <div className="relative aspect-square">
            <ProductImage product={product} className="absolute inset-0" />
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <SummaryRow label="Price" value={`N${product.price.toLocaleString("en-NG")}`} />
            {product.promoPrice && <SummaryRow label="Promo Price" value={`N${product.promoPrice.toLocaleString("en-NG")}`} />}
            <SummaryRow label="Stock" value={`${product.stockCount ?? 0}`} />
            <SummaryRow label="Brand" value={product.brand ?? "—"} />
            <SummaryRow label="Model" value={product.brandSku ?? "—"} />
            <SummaryRow label="Country of Origin" value={product.manufacturedIn ?? "—"} />
          </dl>

          <div className="mt-6 flex flex-col gap-2">
            <form action={onPublish}>
              <button
                type="submit"
                disabled={!draftReady}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85 disabled:opacity-40"
              >
                <CheckCheck className="size-4" aria-hidden />
                Publish to Marketplace
              </button>
            </form>
            <div className="flex gap-2">
              <Link
                href={`/vendor/products/${product.id}/edit`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-soft hover:border-ink"
              >
                <Pencil className="size-3.5" aria-hidden /> Edit
              </Link>
              <form action={onRegenerate} className="flex-1">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-soft hover:border-ink"
                >
                  <Sparkles className="size-3.5" aria-hidden /> Regenerate
                </button>
              </form>
            </div>
            <form action={onDelete}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-[#c0392b] hover:bg-[#fff0ee]"
              >
                <Trash2 className="size-3.5" aria-hidden /> Delete
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-line p-5">
            <p className="font-semibold text-ink">Overview</p>
            <p className="mt-2 text-sm text-text-muted">
              {product.shortDescription || "No description yet — generate details from the New Product wizard, or use Regenerate."}
            </p>
          </div>
          {product.usageTutorial?.map((step, i) => (
            <div key={step.title} className="rounded-2xl border border-line p-5">
              <p className="flex items-center gap-2 font-semibold text-ink">
                <span className="flex size-6 items-center justify-center rounded-full bg-ink text-xs text-white">{i + 1}</span>
                {step.title}
              </p>
              <p className="mt-2 text-sm text-text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type Tab = "specs" | "accessories" | "uses";

function PublishedProductView({
  product,
  reviews,
  onArchive,
  onRestock,
}: {
  product: Product;
  reviews: MockReview[];
  onArchive: () => Promise<void>;
  onRestock: (formData: FormData) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>("specs");

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-ink">{product.name}</h1>
        <StatusPill status={product.status ?? "Active"} />
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
        <span className="font-mono text-xs">{product.sku}</span>
        <span>{product.categoryLabel}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-6 rounded-2xl border border-line p-4 text-sm">
        <Fact label="Brand" value={product.brand ?? "—"} />
        <Fact label="Model" value={product.brandSku ?? "—"} />
        <Fact label="Stock" value={`${product.stockCount ?? 0}`} />
        <Fact label="Made In" value={product.manufacturedIn ?? "—"} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/vendor/products/${product.id}/edit`}
          className="flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
        >
          <Pencil className="size-3.5" aria-hidden /> Edit Product
        </Link>
        <RestockForm onRestock={onRestock} />
        {product.status !== "Archived" && (
          <form action={onArchive}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
            >
              <Archive className="size-3.5" aria-hidden /> Archive
            </button>
          </form>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="relative aspect-square">
          <ProductImage product={product} className="absolute inset-0" />
        </div>

        <div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs font-medium tracking-wide text-text-muted uppercase">Price</p>
              <p className="mt-1 font-[family-name:var(--font-newsreader)] text-2xl text-ink">
                N{(product.promoPrice ?? product.price).toLocaleString("en-NG")}
              </p>
              {product.promoPrice && (
                <p className="text-xs text-text-muted line-through">N{product.price.toLocaleString("en-NG")}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-text-muted uppercase">Stock</p>
              <p className="mt-1 font-[family-name:var(--font-newsreader)] text-2xl text-ink">{product.stockCount ?? 0}</p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto border-b border-line">
            <div className="flex w-max min-w-full gap-6">
              <TabButton active={tab === "specs"} onClick={() => setTab("specs")}>
                Technical Specs
              </TabButton>
              <TabButton active={tab === "accessories"} onClick={() => setTab("accessories")}>
                Included Accessories
              </TabButton>
              <TabButton active={tab === "uses"} onClick={() => setTab("uses")}>
                Clinical Use Cases
              </TabButton>
            </div>
          </div>

          <div className="mt-4">
            {tab === "specs" && (
              <dl className="space-y-3">
                {(product.technicalSpecs ?? []).map((spec) => (
                  <div key={spec.label}>
                    <dt className="text-xs font-medium tracking-wide text-text-muted uppercase">{spec.label}</dt>
                    <dd className="text-sm text-ink">{spec.value}</dd>
                  </div>
                ))}
                {(!product.technicalSpecs || product.technicalSpecs.length === 0) && (
                  <p className="text-sm text-text-muted">No technical specs recorded.</p>
                )}
              </dl>
            )}
            {tab === "accessories" && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
                {(product.includedAccessories ?? []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {(!product.includedAccessories || product.includedAccessories.length === 0) && (
                  <p className="list-none text-sm text-text-muted">No accessories recorded.</p>
                )}
              </ul>
            )}
            {tab === "uses" && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
                {(product.clinicalUseCases ?? []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {(!product.clinicalUseCases || product.clinicalUseCases.length === 0) && (
                  <p className="list-none text-sm text-text-muted">Not applicable for this product.</p>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">No reviews yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-line p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">Verified Buyer</p>
                    <p className="text-xs text-text-muted">
                      {new Date(review.date).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn("size-3.5", i < review.rating ? "fill-signal text-signal" : "text-line")}
                        aria-hidden
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm text-text-muted">{review.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RestockForm({ onRestock }: { onRestock: (formData: FormData) => Promise<void> }) {
  return (
    <form action={onRestock} className="flex items-center gap-2">
      <input
        type="number"
        name="addedUnits"
        min="1"
        defaultValue={10}
        aria-label="Units to add"
        className="w-20 rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink"
      />
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
      >
        <PackagePlus className="size-3.5" aria-hidden /> Restock
      </button>
    </form>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px border-b-2 pb-3 text-sm font-medium whitespace-nowrap transition-colors",
        active ? "border-ink text-ink" : "border-transparent text-text-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-text-muted uppercase">{label}</p>
      <p className="text-ink">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-text-muted uppercase">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
