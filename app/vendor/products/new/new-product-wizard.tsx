"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Boxes, FlaskConical, Microscope, TestTube, UploadCloud, Sparkles, CheckCheck, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductWizardShell, type WizardStepInfo } from "@/components/vendor/product-wizard-shell";
import type { GeneratedProductDetails } from "@/lib/api/vendor-products";
import { createDraftAction, generateDetailsAction, saveDraftAction, publishAction } from "./actions";

interface DraftImage {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary: boolean;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Couldn't read file."));
    reader.readAsDataURL(file);
  });
}

type WizardStep = "categorization" | "identification" | "specifications" | "verification";

const STEPS: WizardStepInfo[] = [
  { key: "categorization", number: 1, label: "Categorization" },
  { key: "identification", number: 2, label: "Identification" },
  { key: "specifications", number: 3, label: "Tech Specifications" },
  { key: "verification", number: 4, label: "Verification" },
];

/** Matches the site's real canonical taxonomy (lib/api/mocks/categories.ts) —
 * the mockup's 4 tiles used slightly different, mismatched labels ("Reagents"
 * and "Culture Media & Kits" as two separate tiles with no matching category
 * to file either under), so this uses the categories that actually filter
 * buyer-side browsing instead. */
const CATEGORIES = [
  { slug: "medical-equipment", label: "Medical Equipment", hint: "Medical & surgical devices", icon: Boxes },
  { slug: "scientific-tools", label: "Scientific Tools", hint: "Instruments & apparatus", icon: Microscope },
  { slug: "reagents-culture-media", label: "Reagents & Culture Media", hint: "Clinical & lab reagents", icon: TestTube },
  { slug: "lab-equipment", label: "Lab Equipments", hint: "Benchtop & general lab gear", icon: FlaskConical },
] as const;

interface IdentificationData {
  name: string;
  brand: string;
  brandSku: string;
  manufacturedIn: string;
  price: string;
  promoPrice: string;
  stockCount: string;
  lowStockThreshold: string;
}

const EMPTY_IDENTIFICATION: IdentificationData = {
  name: "",
  brand: "",
  brandSku: "",
  manufacturedIn: "",
  price: "",
  promoPrice: "",
  stockCount: "",
  lowStockThreshold: "",
};

export function NewProductWizard() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("categorization");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [categorySlug, setCategorySlug] = useState<string>(CATEGORIES[0].slug);
  const [images, setImages] = useState<DraftImage[]>([]);
  const [identification, setIdentification] = useState<IdentificationData>(EMPTY_IDENTIFICATION);
  const [productId, setProductId] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedProductDetails | null>(null);
  const [variant, setVariant] = useState(0);

  const completedStepKeys =
    step === "verification"
      ? ["categorization", "identification", "specifications"]
      : step === "specifications"
        ? ["categorization", "identification"]
        : step === "identification"
          ? ["categorization"]
          : [];

  const categoryLabel = CATEGORIES.find((c) => c.slug === categorySlug)?.label ?? categorySlug;

  function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setImages((prev) => [
      ...prev,
      ...files.map((file, i) => ({
        id: `${Date.now()}-${i}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isPrimary: prev.length === 0 && i === 0, // first image uploaded is primary by default
      })),
    ]);
    e.target.value = ""; // allow re-selecting the same file(s)
  }

  function setPrimaryImage(id: string) {
    setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.id === id })));
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const removed = prev.find((img) => img.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      const next = prev.filter((img) => img.id !== id);
      if (removed?.isPrimary && next.length > 0) next[0] = { ...next[0], isPrimary: true };
      return next;
    });
  }

  const primaryImage = images.find((img) => img.isPrimary) ?? images[0] ?? null;

  function handleIdentificationSubmit(formData: FormData) {
    const data: IdentificationData = {
      name: String(formData.get("name") ?? ""),
      brand: String(formData.get("brand") ?? ""),
      brandSku: String(formData.get("brandSku") ?? ""),
      manufacturedIn: String(formData.get("manufacturedIn") ?? ""),
      price: String(formData.get("price") ?? ""),
      promoPrice: String(formData.get("promoPrice") ?? ""),
      stockCount: String(formData.get("stockCount") ?? ""),
      lowStockThreshold: String(formData.get("lowStockThreshold") ?? ""),
    };
    setIdentification(data);
    setError(null);
    startTransition(async () => {
      let imagePayload: { url: string; isPrimary: boolean }[] = [];
      try {
        imagePayload = await Promise.all(
          images.map(async (img) => ({ url: await readFileAsDataUrl(img.file), isPrimary: img.isPrimary })),
        );
      } catch {
        setError("Couldn't process one of the uploaded images. Please try again.");
        return;
      }
      const result = await createDraftAction({
        categorySlug,
        categoryLabel,
        imageUrl: imagePayload.find((img) => img.isPrimary)?.url ?? null,
        images: imagePayload,
        name: data.name,
        brand: data.brand,
        brandSku: data.brandSku || undefined,
        manufacturedIn: data.manufacturedIn,
        price: Number(data.price),
        promoPrice: data.promoPrice ? Number(data.promoPrice) : undefined,
        stockCount: Number(data.stockCount),
        lowStockThreshold: Number(data.lowStockThreshold) || 0,
      });
      if (result.error || !result.data) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      setProductId(result.data.productId);
      setStep("specifications");
    });
  }

  function handleGenerate(nextVariant: number) {
    setError(null);
    startTransition(async () => {
      const result = await generateDetailsAction(
        { name: identification.name, brand: identification.brand, categorySlug, manufacturedIn: identification.manufacturedIn },
        nextVariant,
      );
      if (result.error || !result.data) {
        setError(result.error ?? "Couldn't generate details.");
        return;
      }
      setGenerated(result.data);
      setVariant(nextVariant);
    });
  }

  function handleSaveDraft() {
    if (!productId || !generated) return;
    setError(null);
    startTransition(async () => {
      const result = await saveDraftAction(productId, generated);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/vendor/products");
    });
  }

  function handlePublish() {
    if (!productId || !generated) return;
    setError(null);
    startTransition(async () => {
      const result = await publishAction(productId, generated);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/vendor/products/${productId}`);
    });
  }

  return (
    <ProductWizardShell
      title="New Product"
      subtitle="Follow the steps to get your product out there"
      steps={STEPS}
      activeStepKey={step}
      completedStepKeys={completedStepKeys}
    >
      {step === "categorization" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-ink">Step 1: Categorization</h2>
            <p className="mt-1 text-sm text-text-muted">
              Select the category that best fits your product and upload its visual documentation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <div>
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center hover:border-ink/40">
              <UploadCloud className="size-6 text-text-muted" aria-hidden />
              <span className="text-sm font-semibold text-ink">Upload Product Images</span>
              <span className="text-xs text-text-muted">Add as many as you like — pick one as the primary image</span>
              <span className="rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink-soft">Browse Files</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImagesChange} />
            </label>

            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-xl border-2",
                      img.isPrimary ? "border-ink" : "border-line",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview, not an optimizable remote asset */}
                    <img src={img.previewUrl} alt="" className="size-full object-cover" />
                    {img.isPrimary && (
                      <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-medium text-white">
                        <Star className="size-2.5 fill-current" aria-hidden />
                        Primary
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      aria-label="Remove image"
                      className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(img.id)}
                        className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        Set as primary
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep("identification")}
              className="rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85"
            >
              Continue to Identification
            </button>
          </div>
        </div>
      )}

      {step === "identification" && (
        <form action={handleIdentificationSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-ink">Step 2: Identification</h2>
            <p className="mt-1 text-sm text-text-muted">
              Set your product pricing, available stock units, and automatic reorder alert levels.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Product Name"
              name="name"
              placeholder="e.g. Contec CMS8000 Multi-Parameter Patient Monitor"
              defaultValue={identification.name}
              required
            />
            <Field label="Manufacturer" name="brand" placeholder="e.g. Contec Medical Systems" defaultValue={identification.brand} required />
            <Field label="Model" name="brandSku" placeholder="e.g. CMS8000-XL" defaultValue={identification.brandSku} />
            <Field
              label="Country of Origin"
              name="manufacturedIn"
              placeholder="e.g. China"
              defaultValue={identification.manufacturedIn}
              required
            />
            <Field label="Price (N)" name="price" type="number" min="0" placeholder="0" defaultValue={identification.price} required />
            <Field label="Promo Price (N)" name="promoPrice" type="number" min="0" placeholder="Optional" defaultValue={identification.promoPrice} />
            <Field label="Stock Units" name="stockCount" type="number" min="0" placeholder="0" defaultValue={identification.stockCount} required />
            <Field
              label="Low-Stock Alert Level"
              name="lowStockThreshold"
              type="number"
              min="0"
              placeholder="e.g. 10"
              defaultValue={identification.lowStockThreshold}
              required
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("categorization")}
              className="rounded-xl border border-line px-6 py-3 text-sm font-medium text-ink-soft hover:border-ink"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Continue to Specifications"}
            </button>
          </div>
        </form>
      )}

      {step === "specifications" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-ink">Step 3: Tech Specifications</h2>
            <p className="mt-1 text-sm text-text-muted">
              Generate a description, spec sheet, and usage tutorial from what you&apos;ve entered so far.
            </p>
          </div>

          {!generated ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => handleGenerate(0)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-10 text-sm font-medium text-ink hover:border-ink/40 disabled:opacity-60"
            >
              <Sparkles className="size-4" aria-hidden />
              {pending ? "Generating…" : "Generate details"}
            </button>
          ) : (
            <GeneratedDetailsEditor generated={generated} onChange={setGenerated} />
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("identification")}
              className="rounded-xl border border-line px-6 py-3 text-sm font-medium text-ink-soft hover:border-ink"
            >
              Back
            </button>
            <div className="flex items-center gap-3">
              {generated && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleGenerate(variant + 1)}
                  className="rounded-xl border border-line px-6 py-3 text-sm font-medium text-ink-soft hover:border-ink disabled:opacity-60"
                >
                  Regenerate
                </button>
              )}
              <button
                type="button"
                disabled={!generated || pending}
                onClick={() => setStep("verification")}
                className="rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85 disabled:opacity-40"
              >
                Continue to Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "verification" && generated && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-ink">Step 4: Verify and Publish</h2>
            <p className="mt-1 text-sm text-text-muted">Confirm the information for your product and publish it to the marketplace.</p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
            <div>
              <span className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-line bg-cream">
                {primaryImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob: preview, not an optimizable remote asset
                  <img src={primaryImage.previewUrl} alt="" className="h-full w-full object-contain p-4" />
                ) : (
                  <span className="text-xs text-text-muted">No image</span>
                )}
              </span>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2">
                  {images.map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element -- local blob: preview, not an optimizable remote asset
                    <img
                      key={img.id}
                      src={img.previewUrl}
                      alt=""
                      className={cn(
                        "size-12 rounded-lg border object-cover",
                        img.isPrimary ? "border-ink" : "border-line",
                      )}
                    />
                  ))}
                </div>
              )}
              <dl className="mt-4 space-y-3 text-sm">
                <SummaryRow label="Price" value={`N${Number(identification.price || 0).toLocaleString("en-NG")}`} />
                {identification.promoPrice && (
                  <SummaryRow label="Promo Price" value={`N${Number(identification.promoPrice).toLocaleString("en-NG")}`} />
                )}
                <SummaryRow label="Stock" value={identification.stockCount} />
                <SummaryRow label="Name" value={identification.name} />
                <SummaryRow label="Brand" value={identification.brand} />
                <SummaryRow label="Model" value={identification.brandSku || "—"} />
                <SummaryRow label="Country of Origin" value={identification.manufacturedIn} />
              </dl>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-line p-5">
                <p className="font-semibold text-ink">Overview</p>
                <p className="mt-2 text-sm text-text-muted">{generated.shortDescription}</p>
              </div>
              {generated.usageTutorial.map((tutorialStep, i) => (
                <div key={tutorialStep.title} className="rounded-2xl border border-line p-5">
                  <p className="flex items-center gap-2 font-semibold text-ink">
                    <span className="flex size-6 items-center justify-center rounded-full bg-ink text-xs text-white">{i + 1}</span>
                    {tutorialStep.title}
                  </p>
                  <p className="mt-2 text-sm text-text-muted">{tutorialStep.body}</p>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => handleGenerate(variant + 1)}
              disabled={pending}
              className="rounded-xl border border-line px-6 py-3 text-sm font-medium text-ink-soft hover:border-ink disabled:opacity-60"
            >
              Regenerate
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={pending}
              className="rounded-xl border border-line px-6 py-3 text-sm font-medium text-ink-soft hover:border-ink disabled:opacity-60"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85 disabled:opacity-60"
            >
              <CheckCheck className="size-4" aria-hidden />
              {pending ? "Publishing…" : "Publish to Marketplace"}
            </button>
          </div>
        </div>
      )}
    </ProductWizardShell>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  min,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  min?: string;
  placeholder?: string;
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
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]"
      />
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

function GeneratedDetailsEditor({
  generated,
  onChange,
}: {
  generated: GeneratedProductDetails;
  onChange: (g: GeneratedProductDetails) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-ink-soft">Overview</label>
        <textarea
          value={generated.shortDescription}
          onChange={(e) => onChange({ ...generated, shortDescription: e.target.value })}
          placeholder="Describe the product for buyers…"
          rows={4}
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-ink/40"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-ink-soft">Technical Specs</p>
        <div className="mt-1.5 space-y-2">
          {generated.technicalSpecs.map((spec, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                value={spec.label}
                placeholder="e.g. Weight"
                onChange={(e) => {
                  const next = [...generated.technicalSpecs];
                  next[i] = { ...next[i], label: e.target.value };
                  onChange({ ...generated, technicalSpecs: next });
                }}
                className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink"
              />
              <input
                value={spec.value}
                placeholder="e.g. 2.5 kg"
                onChange={(e) => {
                  const next = [...generated.technicalSpecs];
                  next[i] = { ...next[i], value: e.target.value };
                  onChange({ ...generated, technicalSpecs: next });
                }}
                className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink"
              />
            </div>
          ))}
        </div>
      </div>

      {generated.includedAccessories.length > 0 && (
        <div>
          <p className="text-sm font-medium text-ink-soft">Included Accessories</p>
          <p className="mt-1.5 text-sm text-text-muted">{generated.includedAccessories.join(", ")}</p>
        </div>
      )}

      {generated.clinicalUseCases.length > 0 && (
        <div>
          <p className="text-sm font-medium text-ink-soft">Clinical Use Cases</p>
          <p className="mt-1.5 text-sm text-text-muted">{generated.clinicalUseCases.join(", ")}</p>
        </div>
      )}
    </div>
  );
}
