import "server-only";
import { readdirSync } from "node:fs";
import path from "node:path";

const BRANDS_DIR = path.join(process.cwd(), "public", "marketing", "brands");

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics (e.g. "Drägerwerk" -> "dragerwerk")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

let cachedFiles: string[] | null = null;
function listBrandLogoFiles(): string[] {
  if (cachedFiles) return cachedFiles;
  try {
    cachedFiles = readdirSync(BRANDS_DIR).filter((f) => /\.(svg|png|jpe?g|webp)$/i.test(f));
  } catch {
    cachedFiles = [];
  }
  return cachedFiles;
}

/**
 * Real logo file for a brand, if one was downloaded into
 * public/marketing/brands/ — matched fuzzily against the brand name
 * (accent/punctuation/case-insensitive substring match) rather than an
 * exact slug, since the files were named by hand. Returns undefined when no
 * match exists, so BrandLogo falls back to its generated initials tile.
 */
export function getBrandLogoPath(brand: string): string | undefined {
  const files = listBrandLogoFiles();
  if (files.length === 0) return undefined;

  const brandKey = normalize(brand);
  const exact = files.find((f) => normalize(path.parse(f).name) === brandKey);
  if (exact) return `/marketing/brands/${exact}`;

  const substring = files.find((f) => {
    const base = normalize(path.parse(f).name);
    return base.includes(brandKey) || brandKey.includes(base);
  });
  if (substring) return `/marketing/brands/${substring}`;

  const firstWord = normalize(brand.split(/\s+/)[0] ?? "");
  if (firstWord.length < 3) return undefined;
  const partial = files.find((f) => normalize(path.parse(f).name).includes(firstWord));
  return partial ? `/marketing/brands/${partial}` : undefined;
}
