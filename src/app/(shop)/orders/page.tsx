import Link from "next/link";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderCard } from "@/components/order-card";
import { getMyOrders } from "@/lib/queries";

export const metadata = { title: "Pesanan Saya" };

export default async function OrdersPage() {
  const orders = await getMyOrders();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Pesanan Saya</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
          <Package className="h-14 w-14 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Belum ada pesanan.</p>
          <Button asChild className="mt-5">
            <Link href="/products">Mulai Belanja</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
