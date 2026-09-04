"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Boxes, FlaskConical, Microscope, TestTube, UploadCloud, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/api/products";
import { updateProductAction } from "@/app/vendor/products/[id]/edit/actions";

/** Single-page "Edit Product" form — the New Product wizard (steps 1-2:
 * categorization + identification) collapsed into one screen since editing
 * doesn't need the guided multi-step flow a first-time listing does. Same
 * canonical category list and image-upload UX as new-product-wizard.tsx. */

const CATEGORIES = [
  { slug: "medical-equipment", label: "Medical Equipment", hint: "Medical & surgical devices", icon: Boxes },
  { slug: "scientific-tools", label: "Scientific Tools", hint: "Instruments & apparatus", icon: Microscope },
  { slug: "reagents-culture-media", label: "Reagents & Culture Media", hint: "Clinical & lab reagents", icon: TestTube },
  { slug: "lab-equipment", label: "Lab Equipment", hint: "Benchtop & general lab gear", icon: FlaskConical },
] as const;

/** One image slot — either already saved (url, no File) or freshly picked in
 * this session (file + local blob preview). Submit reads the URL straight
 * off saved ones and reads new ones into data URLs, same as the wizard. */
interface EditImage {
  id: string;
  url: string;
  isPrimary: boolean;
  file?: File;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Couldn't read file."));
    reader.readAsDataURL(file);
  });
}

export function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [categorySlug, setCategorySlug] = useState(product.categorySlug);
  const [images, setImages] = useState<EditImage[]>(() => {
    if (product.images && product.images.length > 0) {
      return product.images.map((img, i) => ({ id: `existing-${i}`, url: img.url, isPrimary: img.isPrimary }));
    }
    if (product.imageUrl) {
      return [{ id: "existing-0", url: product.imageUrl, isPrimary: true }];
    }
    return [];
  });

  const primaryImage = images.find((img) => img.isPrimary) ?? images[0] ?? null;
  const supportingImages = images.filter((img) => img.id !== primaryImage?.id);

  function handlePrimaryImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImages((prev) => [
        ...prev.map((img) => ({ ...img, isPrimary: false })),
        { id: `new-${Date.now()}`, file, url: URL.createObjectURL(file), isPrimary: true },
      ]);
    }
    e.target.value = "";
  }

  function handleSupportingImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setImages((prev) => [
      ...prev,
      ...files.map((file, i) => ({
        id: `new-${Date.now()}-${i}`,
        file,
        url: URL.createObjectURL(file),
        isPrimary: prev.length === 0 && i === 0,
      })),
    ]);
    e.target.value = "";
  }

  function setPrimaryImage(id: string) {
    setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.id === id })));
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const removed = prev.find((img) => img.id === id);
      if (removed?.file) URL.revokeObjectURL(removed.url);
      const next = prev.filter((img) => img.id !== id);
      if (removed?.isPrimary && next.length > 0) next[0] = { ...next[0], isPrimary: true };
      return next;
    });
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      let imagePayload: { url: string; isPrimary: boolean }[] = [];
      try {
        imagePayload = await Promise.all(
          images.map(async (img) => ({ url: img.file ? await readFileAsDataUrl(img.file) : img.url, isPrimary: img.isPrimary })),
        );
      } catch {
        setError("Couldn't process one of the uploaded images. Please try again.");
        return;
      }
      const category = CATEGORIES.find((c) => c.slug === categorySlug);
      const price = Number(formData.get("price"));
      const promoPrice = formData.get("promoPrice") ? Number(formData.get("promoPrice")) : undefined;
      const stockCount = Number(formData.get("stockCount"));
      const lowStockThreshold = Number(formData.get("lowStockThreshold")) || 0;
      const name = String(formData.get("name") ?? "").trim();
      const brand = String(formData.get("brand") ?? "").trim();

      if (!name || !brand || !price || Number.isNaN(price)) {
        setError("Fill in the required fields (name, manufacturer, price).");
        return;
      }

      const result = await updateProductAction(product.id, {
        categorySlug,
        categoryLabel: category?.label ?? categorySlug,
        name,
        brand,
        brandSku: String(formData.get("brandSku") ?? "").trim() || undefined,
        manufacturedIn: String(formData.get("manufacturedIn") ?? "").trim(),
        price,
        promoPrice,
        stockCount,
        lowStockThreshold,
        images: imagePayload,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/vendor/products/${product.id}`);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      <div>
        <p className="text-sm font-medium text-ink-soft">Category</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const selected = categorySlug === category.slug;
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => setCategorySlug(category.slug)}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                  selected ? "border-ink bg-mint/40" : "border-line bg-white hover:border-ink/30",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    selected ? "bg-ink text-white" : "bg-cream text-ink-soft",
                  )}
                >
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{category.label}</span>
                  <span className="block text-xs text-text-muted">{category.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-ink-soft">Primary Image</p>
        <p className="mt-1 text-xs text-text-muted">
          This is the image customers see first — on the marketplace grid, search results, and at the top of the
          product page. Use a clear, high-quality photo.
        </p>

        {primaryImage ? (
          <div className="group relative mt-3 size-40 overflow-hidden rounded-2xl border-2 border-ink">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob:/data: preview, not an optimizable remote asset */}
            <img src={primaryImage.url} alt="" className="size-full object-cover" />
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-ink/60 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              Change
              <input type="file" accept="image/*" className="hidden" onChange={handlePrimaryImageChange} />
            </label>
            <button
              type="button"
              onClick={() => removeImage(primaryImage.id)}
              aria-label="Remove primary image"
              className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ) : (
          <label className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-line px-6 py-8 text-center hover:border-ink/40">
            <UploadCloud className="size-6 text-text-muted" aria-hidden />
            <span className="text-sm font-semibold text-ink">Upload Primary Image</span>
            <span className="rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink-soft">Browse Files</span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePrimaryImageChange} />
          </label>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-ink-soft">
          Supporting Images <span className="text-text-muted">(optional)</span>
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Extra angles, accessories, or close-up detail shots — shown when a customer opens the full product page.
        </p>

        {supportingImages.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {supportingImages.map((img) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob:/data: preview, not an optimizable remote asset */}
                <img src={img.url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  aria-label="Remove image"
                  className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setPrimaryImage(img.id)}
                  className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-ink/70 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Star className="size-2.5" aria-hidden />
                  Set as primary
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-center hover:border-ink/40">
          <UploadCloud className="size-4 text-text-muted" aria-hidden />
          <span className="text-sm font-medium text-ink-soft">Add supporting images</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleSupportingImagesChange} />
        </label>
      </div>

      <div>
        <p className="text-sm font-medium text-ink-soft">Details</p>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Product Name" name="name" defaultValue={product.name} required />
          <Field label="Manufacturer" name="brand" defaultValue={product.brand ?? ""} required />
          <Field label="Model" name="brandSku" defaultValue={product.brandSku ?? ""} />
          <Field label="Country of Origin" name="manufacturedIn" defaultValue={product.manufacturedIn ?? ""} />
          <Field label="Price (NGN)" name="price" type="number" min="0" defaultValue={String(product.price)} required />
          <Field label="Promo Price (NGN)" name="promoPrice" type="number" min="0" defaultValue={product.promoPrice ? String(product.promoPrice) : ""} />
          <Field label="Stock Count" name="stockCount" type="number" min="0" defaultValue={String(product.stockCount ?? 0)} required />
          <Field label="Low Stock Alert Threshold" name="lowStockThreshold" type="number" min="0" defaultValue={String(product.lowStockThreshold ?? 0)} />
        </div>
      </div>

      {error && <p className="text-sm text-[#c0392b]">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/vendor/products/${product.id}`)}
          className="rounded-xl border border-line px-6 py-3 text-sm font-medium text-ink-soft hover:bg-cream"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  min,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  min?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-ink-soft">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        min={min}
        defaultValue={defaultValue}
        required={required}
        className="mt-1 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink/40"
      />
    </div>
  );
}
