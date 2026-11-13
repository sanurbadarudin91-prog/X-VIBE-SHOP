"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { formatIDR } from "@/lib/utils";
import { removeCartItem, updateCartQuantity } from "@/lib/actions/cart";
import type { CartItem } from "@/lib/types";

export function CartLineItem({ item }: { item: CartItem }) {
  const { refresh } = useCart();
  const [pending, startTransition] = useTransition();
  const [qty, setQty] = useState(item.quantity);

  const p = item.products;
  const stock = p?.stock ?? 0;

  function change(next: number) {
    if (next < 1) return;
    if (next > stock) {
      toast.error(`Stok tersisa hanya ${stock}.`);
      return;
    }
    setQty(next);
    startTransition(async () => {
      const res = await updateCartQuantity(item.id, next);
      if (!res.ok) {
        toast.error(res.message);
        setQty(item.quantity);
      }
      await refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await removeCartItem(item.id);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      await refresh();
    });
  }

  return (
    <div className="flex gap-4 rounded-lg border border-border bg-card p-4">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
        {p?.image_url && (
          <Image src={p.image_url} alt={p.title} fill sizes="96px" className="object-cover" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${item.product_id}`}
            className="font-medium hover:text-primary"
          >
            {p?.title ?? "Produk"}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={remove}
            disabled={pending}
            aria-label="Hapus produk"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <span className="mt-1 text-sm text-primary">{formatIDR(p?.price ?? 0)}</span>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => change(qty - 1)}
              disabled={pending || qty <= 1}
              aria-label="Kurangi jumlah"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-10 text-center font-medium">{qty}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => change(qty + 1)}
              disabled={pending || qty >= stock}
              aria-label="Tambah jumlah"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <span className="font-semibold">
            {formatIDR(Number(p?.price ?? 0) * qty)}
          </span>
        </div>
      </div>
    </div>
  );
}
