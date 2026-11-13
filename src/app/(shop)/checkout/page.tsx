import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { getAddresses, getCart, getMyVouchers } from "@/lib/queries";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const [cart, addresses, userVouchers] = await Promise.all([
    getCart(),
    getAddresses(),
    getMyVouchers(),
  ]);

  const subtotal = cart.reduce(
    (sum, i) => sum + Number(i.products?.price ?? 0) * i.quantity,
    0,
  );

  const activeVouchers = userVouchers.filter((v) => !v.is_used && v.vouchers);

  if (cart.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Keranjang Kosong</h1>
        <p className="mt-2 text-muted-foreground">
          Tambahkan produk sebelum melakukan checkout.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Belanja Sekarang</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Checkout</h1>
      <CheckoutClient
        addresses={addresses}
        userVouchers={activeVouchers}
        subtotal={subtotal}
      />
    </div>
  );
}
