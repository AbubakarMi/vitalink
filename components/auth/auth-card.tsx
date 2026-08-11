import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { VitalsWaveform } from "@/components/marketing/vitals-waveform";

/**
 * Split-screen auth shell — a branded ink panel (reusing the hero's vitals-
 * trace signature, at a reduced scale, not the hero itself) alongside the
 * actual form. Replaces the earlier plain centered-card-on-empty-background
 * layout, which read as dated next to the rest of the redesign.
 */
export function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink px-12 py-10 text-white lg:flex">
        <VitalsWaveform
          cycles={5}
          strokeWidth={2}
          ghostOpacity={0.25}
          className="pointer-events-none absolute inset-x-0 top-1/2 h-56 -translate-y-1/2 text-signal opacity-60"
        />

        <Link href="/" className="relative font-alata text-2xl tracking-tight text-white">
          VITALINK
        </Link>

        <div className="relative max-w-md">
          <p className="font-[family-name:var(--font-newsreader)] text-4xl leading-[1.15] tracking-[-0.02em]">
            Verified equipment. Verified vendors. Verified care.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-white/60">
            <ShieldCheck className="size-5 text-signal" aria-hidden />
            NAFDAC &amp; FDA verification on every listing
          </div>
        </div>
      </div>

      <div className="flex flex-col bg-cream">
        <header className="px-8 py-6 lg:hidden">
          <Link href="/" className="font-alata text-2xl tracking-tight text-ink">
            VITALINK
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-12">
          <div className="w-full max-w-sm">
            <span className="inline-block rounded-full bg-mint px-3 py-1 text-xs font-medium tracking-wide text-ink-soft uppercase">
              {eyebrow}
            </span>
            <h1 className="mt-4 font-[family-name:var(--font-newsreader)] text-4xl leading-[1.1] tracking-[-0.02em] text-ink">
              {title}
            </h1>
            <p className="mt-2 text-sm text-text-muted">{subtitle}</p>

            <div className="mt-8">{children}</div>

            <div className="mt-8 border-t border-line pt-6 text-center text-sm text-text-muted">{footer}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
