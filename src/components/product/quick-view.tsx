"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { useOptionalI18n } from "@/lib/i18n/provider";
import { colorSwatch, variantStock } from "@/lib/variants";
import { cn, formatIDR } from "@/lib/utils";
import type { Product } from "@/lib/types";

/**
 * Quick View: pratinjau produk + pilih varian + tambah ke keranjang tanpa
 * meninggalkan halaman katalog.
 */
export function QuickViewButton({ product }: { product: Product }) {
  const { t } = useOptionalI18n();
  const [open, setOpen] = useState(false);

  const colors = product.colors ?? [];
  const sizes = product.sizes ?? [];
  const colorHex = product.color_hex ?? {};
  const variantStockMap = product.variant_stock ?? {};

  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const [size, setSize] = useState<string | null>(sizes[0] ?? null);

  const hasColors = colors.length > 0;
  const hasSizes = sizes.length > 0;
  const selectedStock =
    hasColors || hasSizes
      ? variantStock({ stock: product.stock, variant_stock: variantStockMap }, color, size)
      : product.stock;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-background/90 px-3 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-[1px] transition-opacity"
      >
        {t("product.quickView")}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={product.title}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.title}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 90vw, 320px"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-xs text-muted-foreground">
                {t("product.noImage")}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <Badge tone="muted" className="self-start">
              {product.category}
            </Badge>
            <p className="mt-2 text-xl font-extrabold text-primary">
              {formatIDR(product.price)}
            </p>
            {product.description && (
              <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">
                {product.description}
              </p>
            )}

            {hasColors && (
              <div className="mt-3">
                <span className="text-xs font-medium">{t("product.color")}</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-pressed={color === c}
                      aria-label={c}
                      title={c}
                      className={cn(
                        "h-7 w-7 rounded-full border-2 transition-all",
                        color === c
                          ? "border-primary ring-2 ring-primary/40"
                          : "border-border hover:border-primary/60",
                      )}
                      style={{ backgroundColor: colorSwatch(c, colorHex) }}
                    />
                  ))}
                </div>
              </div>
            )}

            {hasSizes && (
              <div className="mt-3">
                <span className="text-xs font-medium">{t("product.size")}</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      aria-pressed={size === s}
                      className={cn(
                        "min-w-9 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                        size === s
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/60",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              {selectedStock > 0
                ? `${t("product.stockAvailable")}: ${selectedStock}`
                : t("product.stockEmpty")}
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <AddToCartButton
                productId={product.id}
                stock={selectedStock}
                variantColor={hasColors ? color : null}
                variantSize={hasSizes ? size : null}
                fullWidth
              />
              <Button asChild variant="ghost" className="w-full">
                <Link href={`/products/${product.id}`}>
                  {t("product.viewDetail")} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
