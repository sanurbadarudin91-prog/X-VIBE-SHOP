"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { formatIDR } from "@/lib/utils";
import {
  removeCartItem,
  updateCartQuantity,
} from "@/lib/actions/cart";

export function CartDrawer() {
  const { items, open, setOpen, refresh } = useCart();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const subtotal = items.reduce(
    (sum, i) => sum + Number(i.products?.price ?? 0) * i.quantity,
    0,
  );

  function changeQty(cartItemId: string, quantity: number) {
    setBusyId(cartItemId);
    startTransition(async () => {
      const res = await updateCartQuantity(cartItemId, quantity);
      if (!res.ok) toast.error(res.message);
      await refresh();
      setBusyId(null);
    });
  }

  function removeItem(cartItemId: string) {
    setBusyId(cartItemId);
    startTransition(async () => {
      const res = await removeCartItem(cartItemId);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      await refresh();
      setBusyId(null);
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <ShoppingBag className="h-5 w-5 text-primary" /> Keranjang
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Tutup">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Keranjang Anda masih kosong.</p>
            <Button asChild variant="outline" onClick={() => setOpen(false)}>
              <Link href="/products">Mulai Belanja</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {items.map((item) => {
                const p = item.products;
                return (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                      {p?.image_url && (
                        <Image
                          src={p.image_url}
                          alt={p.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        href={`/products/${item.product_id}`}
                        onClick={() => setOpen(false)}
                        className="truncate text-sm font-medium hover:text-primary"
                      >
                        {p?.title ?? "Produk"}
                      </Link>
                      <span className="text-sm font-semibold text-primary">
                        {formatIDR(p?.price ?? 0)}
                      </span>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={pending && busyId === item.id}
                            onClick={() => changeQty(item.id, item.quantity - 1)}
                            aria-label="Kurangi"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={pending && busyId === item.id}
                            onClick={() => changeQty(item.id, item.quantity + 1)}
                            aria-label="Tambah"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                          aria-label="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-bold">{formatIDR(subtotal)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" onClick={() => setOpen(false)}>
                  <Link href="/cart">Lihat Keranjang</Link>
                </Button>
                <Button asChild onClick={() => setOpen(false)}>
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
