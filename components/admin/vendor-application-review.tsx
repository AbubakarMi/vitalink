"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, X, ExternalLink } from "lucide-react";
import { approveVendorAction, rejectVendorAction } from "@/app/admin/actions";
import { DocumentPreviewModal } from "@/components/admin/document-preview-modal";
import { StatusPill } from "@/components/admin/status-pill";
import type { AdminVendor } from "@/lib/api/admin/vendors";
import type { VendorDocument } from "@/lib/api/admin/vendor-documents";
import type { AdminProduct } from "@/lib/api/admin/products";

type Tab = "identity" | "business" | "compliance" | "products";

const TABS: { key: Tab; label: string }[] = [
  { key: "identity", label: "Identity" },
  { key: "business", label: "Business Profile" },
  { key: "compliance", label: "Compliance" },
  { key: "products", label: "Products" },
];

/**
 * Vendor Application review — 4-tab layout from super admin/Vendor
 * Application Identity.pdf + Business Profile.pdf + (1)/(2) (compliance
 * documents, products, Approve/Decline). Identity/Business Profile fields
 * beyond the confirmed-real GetVendors ones render only when present
 * (lib/api/admin/vendors.ts's AdminVendorSchema comment explains why they're
 * optional) rather than showing blank rows for fields the backend may not
 * send yet.
 */
export function VendorApplicationReview({
  vendor,
  documents,
  products,
}: {
  vendor: AdminVendor;
  documents: VendorDocument[] | null;
  products: AdminProduct[] | null;
}) {
  const [tab, setTab] = useState<Tab>("identity");
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isDecided = vendor.verificationStatus === "Verified" || vendor.verificationStatus === "Rejected";

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveVendorAction(vendor.id);
      if (result.error) setError(result.error);
    });
  }

  function handleDecline(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await rejectVendorAction(vendor.id, reason.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      setDeclining(false);
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-line p-6">
        <div className="flex items-center gap-4">
          {vendor.applicantAvatarUrl ? (
            <Image
              src={vendor.applicantAvatarUrl}
              alt=""
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-mint text-lg font-bold text-ink-soft">
              {vendor.businessLegalName.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="text-xl font-semibold text-ink">{vendor.businessLegalName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-muted">
              <span>{vendor.vendorType}</span>
              <StatusPill status={vendor.verificationStatus} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 border-b border-line px-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`relative py-3.5 text-sm font-medium transition-colors ${
              tab === t.key ? "text-verified" : "text-text-muted hover:text-ink"
            }`}
          >
            {t.label}
            {tab === t.key && <span className="absolute right-0 -bottom-px left-0 h-0.5 rounded-full bg-verified" />}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === "identity" && <IdentityTab vendor={vendor} />}
        {tab === "business" && <BusinessProfileTab vendor={vendor} />}
        {tab === "compliance" && <ComplianceTab vendorId={vendor.id} documents={documents} />}
        {tab === "products" && <ProductsTab products={products} />}
      </div>

      {!isDecided && (
        <div className="border-t border-line p-6">
          {!declining ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleApprove}
                disabled={pending}
                className="flex items-center gap-2 rounded-lg border-2 border-ink px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-50"
              >
                <Check className="size-4" aria-hidden />
                Approve
              </button>
              <button
                type="button"
                onClick={() => setDeclining(true)}
                disabled={pending}
                className="flex items-center gap-2 rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-50"
              >
                <X className="size-4" aria-hidden />
                Decline
              </button>
            </div>
          ) : (
            <form onSubmit={handleDecline} className="space-y-3">
              <label htmlFor="decline-reason" className="text-sm font-medium text-ink">
                Please kindly provide the reason for declining the request
              </label>
              <textarea
                id="decline-reason"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Start typing…"
                rows={4}
                className="w-full rounded-xl border border-line px-4 py-3 text-sm text-ink outline-none focus:border-verified"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-50"
                >
                  {pending ? "Submitting…" : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeclining(false)}
                  className="rounded-lg border border-line px-6 py-2.5 text-sm font-medium text-ink-soft hover:bg-cream"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {error && <p className="mt-3 text-sm text-[#c0392b]">{error}</p>}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide text-text-muted uppercase">{label}</p>
      <p className="mt-1 text-ink">{value}</p>
    </div>
  );
}

function IdentityTab({ vendor }: { vendor: AdminVendor }) {
  const hasIdentity = vendor.applicantFirstName || vendor.applicantEmail || vendor.applicantPhone;
  if (!hasIdentity) {
    return <p className="text-sm text-text-muted">Applicant identity details aren&apos;t available for this vendor yet.</p>;
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First Name" value={vendor.applicantFirstName} />
        <Field label="Last Name" value={vendor.applicantLastName} />
        <Field label="Email" value={vendor.applicantEmail} />
        <Field label="Phone" value={vendor.applicantPhone} />
        <Field label="Country" value={vendor.applicantCountry} />
      </div>
      {vendor.deliveryAddress && (
        <div>
          <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">Delivery Address</p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="State" value={vendor.deliveryAddress.state} />
            <Field label="City" value={vendor.deliveryAddress.city} />
            <Field label="Street Address" value={vendor.deliveryAddress.addressLine} />
          </div>
        </div>
      )}
    </div>
  );
}

function BusinessProfileTab({ vendor }: { vendor: AdminVendor }) {
  return (
    <div className="space-y-4">
      <Field label="Legal Business Name" value={vendor.businessLegalName} />
      <Field label="Tax ID" value={vendor.taxId} />
      <Field label="Business Registration Number" value={vendor.businessRegistrationNumber} />
      {vendor.businessAddress && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Address" value={vendor.businessAddress.addressLine} />
          <Field label="City" value={vendor.businessAddress.city} />
          <Field label="State" value={vendor.businessAddress.state} />
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Phone Number" value={vendor.businessPhone} />
        <Field label="Email" value={vendor.businessEmail} />
      </div>
      <Field label="Website" value={vendor.websiteUrl} />
    </div>
  );
}

function ComplianceTab({ vendorId, documents }: { vendorId: string; documents: VendorDocument[] | null }) {
  if (documents === null) {
    return <p className="text-sm text-text-muted">Compliance documents aren&apos;t available for this vendor yet.</p>;
  }
  if (documents.length === 0) {
    return <p className="text-sm text-text-muted">No compliance documents uploaded.</p>;
  }
  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <div key={doc.id}>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-ink">{doc.label}</p>
            {doc.required && (
              <span className="rounded-full bg-[#fff0ee] px-2 py-0.5 text-[10px] font-medium text-[#c0392b]">Required</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-cream/40 px-4 py-3">
            {doc.uploaded ? (
              <>
                <span className="truncate text-sm text-ink-soft">{doc.fileName ?? doc.label}</span>
                <DocumentPreviewModal vendorId={vendorId} documentId={doc.id} label={doc.label} />
              </>
            ) : (
              <p className="text-sm text-text-muted">Not uploaded</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductsTab({ products }: { products: AdminProduct[] | null }) {
  if (products === null) {
    return <p className="text-sm text-text-muted">Product listings aren&apos;t available for this vendor yet.</p>;
  }
  if (products.length === 0) {
    return <p className="text-sm text-text-muted">This vendor hasn&apos;t listed any products.</p>;
  }
  return (
    <div className="divide-y divide-line">
      {products.map((product) => (
        <div key={product.id} className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{product.name}</p>
            {product.sku && <p className="text-xs text-text-muted">SKU: {product.sku}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span className="text-sm text-ink">N{product.price.toLocaleString("en-NG")}</span>
            <StatusPill status={product.status} />
            <Link href={`/admin/inventory/${product.id}`} className="flex items-center gap-1 text-xs font-medium text-verified hover:underline">
              View
              <ExternalLink className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
