import Image from "next/image";
import { QuantityAddToCart } from "@/components/marketplace/quantity-add-to-cart";
import type { Product } from "@/lib/api/products";

/** Figma EZER-KEY node 1591:3582 "Product Basic Info". */
export function ProductHero({ product }: { product: Product }) {
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[717fr_588fr]">
      <div className="flex h-[465px] items-center justify-center rounded-[5px] bg-[#f4f4f2]">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} width={327} height={309} className="object-contain" />
        ) : (
          <div className="size-40 rounded-full bg-white" aria-hidden />
        )}
      </div>

      <div className="flex flex-col">
        <span className="flex w-fit items-center gap-1 rounded-[3px] bg-[#f0ffdf] px-3.5 py-2 text-sm text-[#1a4d3e]">
          <Image src="/marketplace/category-icon.svg" alt="" width={20} height={20} aria-hidden />
          {product.categoryLabel ?? product.categorySlug}
        </span>

        <h1 className="mt-6 text-[40px] leading-tight font-semibold text-[#4a7a4a]">{product.name}</h1>

        <div className="mt-8 flex flex-wrap gap-3 text-[14px] font-medium text-[#93a1b7]">
          {product.brandSku && (
            <div>
              <p className="text-[14px]">MODEL</p>
              <span className="mt-2 flex items-center rounded-[5px] bg-[#ededed] px-4 py-2 whitespace-nowrap">
                {product.brandSku}
              </span>
            </div>
          )}
          {product.stockCount !== undefined && (
            <div>
              <p className="text-[14px]">STOCK</p>
              <span className="mt-2 flex items-center gap-1 rounded-[5px] bg-[#5c8aff] px-4 py-2 font-bold text-[#e6f4ea]">
                <Image src="/marketplace/stock-icon.svg" alt="" width={14} height={14} aria-hidden />
                {product.stockCount}
              </span>
            </div>
          )}
          {product.manufacturedIn && (
            <div>
              <p className="text-[14px]">MANUFACTURED IN</p>
              <span className="mt-2 flex items-center rounded-[5px] bg-[#ededed] px-4 py-2 whitespace-nowrap uppercase">
                {product.manufacturedIn}
              </span>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-baseline gap-4 font-['Reddit_Sans',_sans-serif]">
          <span className="text-[40px] text-[#1a4d3e]">N{product.price.toLocaleString("en-NG")}</span>
          {product.originalPrice && (
            <span className="text-xl text-[#c1c8c4] line-through">
              N{product.originalPrice.toLocaleString("en-NG")}
            </span>
          )}
          {discountPercent !== null && discountPercent > 0 && (
            <span className="rounded-[5px] bg-[#fff0ee] px-2.5 py-1 text-[10px] font-semibold text-[#ff4141]">
              {discountPercent}% off
            </span>
          )}
        </div>

        <div className="mt-8">
          <QuantityAddToCart product={product} />
        </div>
      </div>
    </div>
  );
}
