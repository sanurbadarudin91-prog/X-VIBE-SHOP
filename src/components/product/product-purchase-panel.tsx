"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { cn } from "@/lib/utils";

/**
 * Panel pembelian produk: pemilih warna interaktif + stok per varian yang
 * berubah real-time, plus tombol keranjang/beli yang mengikuti warna terpilih.
 */
export function ProductPurchasePanel({
  productId,
  stock,
  colors,
  variantStock,
  className,
}: {
  productId: string;
  stock: number;
  colors: string[];
  variantStock: Record<string, number>;
  className?: string;
}) {
  const [selected, setSelected] = useState<string | null>(
    colors.length > 0 ? colors[0] : null,
  );

  const hasVariants = colors.length > 0;
  const selectedStock = selected
    ? Number(variantStock[selected] ?? 0)
    : stock;
  const effectiveStock = hasVariants ? selectedStock : stock;

  return (
    <div className={cn("space-y-4", className)}>
      {hasVariants && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Warna</span>
            <span className="text-xs text-muted-foreground">
              Dipilih: <strong>{selected ?? "—"}</strong>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const s = Number(variantStock[c] ?? 0);
              const out = s <= 0;
              const active = selected === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelected(c)}
                  disabled={out}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/60",
                    out && "cursor-not-allowed opacity-40 line-through",
                  )}
                >
                  {c}
                  <span className="ml-1 text-xs text-muted-foreground">({s})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-sm">
        {effectiveStock > 0 ? (
          <Badge tone={effectiveStock <= 5 ? "warning" : "success"}>
            Stok tersedia: {effectiveStock}
            {hasVariants && selected ? ` · ${selected}` : ""}
          </Badge>
        ) : (
          <Badge tone="danger">
            {hasVariants ? "Stok warna ini habis" : "Stok habis"}
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <AddToCartButton
          productId={productId}
          stock={effectiveStock}
          variantColor={hasVariants ? selected : null}
          className="flex-1"
        />
        <AddToCartButton
          productId={productId}
          stock={effectiveStock}
          variantColor={hasVariants ? selected : null}
          buyNow
          className="flex-1"
        />
      </div>
    </div>
  );
}
