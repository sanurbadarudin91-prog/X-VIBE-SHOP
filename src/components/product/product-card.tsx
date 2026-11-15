import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { colorSwatch } from "@/lib/variants";
import { formatIDR } from "@/lib/utils";
import type { Product } from "@/lib/types";

/**
 * Kartu produk minimalis bergaya aplikasi mobile: gambar dominan, judul ringkas,
 * harga tegas, deretan swatch warna, dan tombol keranjang berbentuk ikon.
 */
export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0;
  const colors = (product.colors ?? []).slice(0, 4);

  return (
    <Card className="group flex flex-col overflow-hidden rounded-2xl border-border/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-[4/5] overflow-hidden bg-muted"
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-xs text-muted-foreground">
            Tanpa gambar
          </div>
        )}

        {outOfStock && (
          <span className="absolute inset-0 grid place-items-center bg-background/70 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-[1px]">
            Stok Habis
          </span>
        )}
        {!outOfStock && product.stock <= 5 && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-black">
            Sisa {product.stock}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link
          href={`/products/${product.id}`}
          className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary"
        >
          {product.title}
        </Link>

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-primary">
            {formatIDR(product.price)}
          </span>
          {colors.length > 0 && (
            <span className="flex items-center gap-1">
              {colors.map((c) => (
                <span
                  key={c}
                  title={c}
                  className="h-3 w-3 rounded-full border border-border"
                  style={{ backgroundColor: colorSwatch(c, product.color_hex) }}
                />
              ))}
            </span>
          )}
        </div>

        <div className="mt-1">
          <AddToCartButton productId={product.id} stock={product.stock} fullWidth />
        </div>
      </div>
    </Card>
  );
}
