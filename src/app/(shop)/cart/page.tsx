import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { getCart } from "@/lib/queries";
import { formatIDR } from "@/lib/utils";

export const metadata = { title: "Keranjang" };

export default async function CartPage() {
  const items = await getCart();
  const subtotal = items.reduce(
    (sum, i) => sum + Number(i.products?.price ?? 0) * i.quantity,
    0,
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Keranjang Kosong</h1>
        <p className="mt-2 text-muted-foreground">
          Belum ada produk di keranjang Anda.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Mulai Belanja</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Keranjang Belanja</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-3">
            {items.map((item) => (
              <CartLineItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Ringkasan</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatIDR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Jumlah item</dt>
              <dd className="font-medium">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-bold">
            <span>Total</span>
            <span className="text-primary">{formatIDR(subtotal)}</span>
          </div>
          <Button asChild className="mt-5 w-full">
            <Link href="/checkout">
              Lanjut ke Checkout <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link href="/products">Tambah produk lain</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
