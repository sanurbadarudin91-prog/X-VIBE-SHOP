import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { formatIDR } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0;

  return (
    <Card className="group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg">
      <Link href={`/products/${product.id}`} className="relative block aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">Tanpa gambar</div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          <Badge tone="muted">{product.category}</Badge>
          {outOfStock && <Badge tone="danger">Habis</Badge>}
          {!outOfStock && product.stock <= 5 && (
            <Badge tone="warning">Sisa {product.stock}</Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/products/${product.id}`} className="line-clamp-2 text-sm font-medium hover:text-primary">
          {product.title}
        </Link>
        <div className="mt-2 flex items-end justify-between">
          <span className="text-base font-bold text-primary">{formatIDR(product.price)}</span>
          <span className="text-xs text-muted-foreground">Stok {product.stock}</span>
        </div>
        <div className="mt-3">
          <AddToCartButton productId={product.id} stock={product.stock} fullWidth />
        </div>
      </div>
    </Card>
  );
}
