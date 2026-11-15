"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { colorSwatch, variantStock } from "@/lib/variants";
import { useOptionalI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * Panel pembelian produk: pemilih warna (swatch) + ukuran interaktif dengan
 * stok per varian yang berubah real-time, plus tombol keranjang/beli.
 */
export function ProductPurchasePanel({
  productId,
  stock,
  colors,
  sizes,
  colorHex,
  variantStock: variantStockMap,
  className,
}: {
  productId: string;
  stock: number;
  colors: string[];
  sizes: string[];
  colorHex: Record<string, string>;
  variantStock: Record<string, number>;
  className?: string;
}) {
  const { t } = useOptionalI18n();
  const [color, setColor] = useState<string | null>(
    colors.length > 0 ? colors[0] : null,
  );
  const [size, setSize] = useState<string | null>(
    sizes.length > 0 ? sizes[0] : null,
  );

  const hasColors = colors.length > 0;
  const hasSizes = sizes.length > 0;

  const product = { stock, variant_stock: variantStockMap };

  // Stok kombinasi terpilih; bila belum lengkap, pakai stok warna terpilih.
  const selectedStock =
    hasColors || hasSizes
      ? variantStock(product, color, size)
      : stock;

  return (
    <div className={cn("space-y-4", className)}>
      {hasColors && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">{t("product.color")}</span>
            <span className="text-xs text-muted-foreground">
              {t("product.selected")}: <strong>{color ?? "—"}</strong>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const active = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-pressed={active}
                  aria-label={c}
                  title={c}
                  className={cn(
                    "relative h-9 w-9 rounded-full border-2 transition-all",
                    active
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-border hover:border-primary/60",
                  )}
                  style={{ backgroundColor: colorSwatch(c, colorHex) }}
                >
                  {active && (
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="h-2 w-2 rounded-full bg-white/90 shadow" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasSizes && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">{t("product.size")}</span>
            <span className="text-xs text-muted-foreground">
              {t("product.selected")}: <strong>{size ?? "—"}</strong>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const active = size === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  aria-pressed={active}
                  className={cn(
                    "min-w-11 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/60",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-sm">
        {selectedStock > 0 ? (
          <Badge tone={selectedStock <= 5 ? "warning" : "success"}>
            {t("product.stockAvailable")}: {selectedStock}
            {hasColors && color ? ` · ${color}` : ""}
            {hasSizes && size ? ` / ${size}` : ""}
          </Badge>
        ) : (
          <Badge tone="danger">
            {hasColors || hasSizes ? t("product.variantEmpty") : t("product.stockEmpty")}
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <AddToCartButton
          productId={productId}
          stock={selectedStock}
          variantColor={hasColors ? color : null}
          variantSize={hasSizes ? size : null}
          className="flex-1"
        />
        <AddToCartButton
          productId={productId}
          stock={selectedStock}
          variantColor={hasColors ? color : null}
          variantSize={hasSizes ? size : null}
          buyNow
          className="flex-1"
        />
      </div>
    </div>
  );
}
