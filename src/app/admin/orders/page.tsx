import { OrderTable } from "@/components/admin/order-table";
import { getAdminOrders } from "@/lib/queries";

export const metadata = { title: "Manajemen Pesanan" };

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Pesanan</h1>
        <p className="text-sm text-muted-foreground">
          {orders.length} pesanan dari seluruh customer.
        </p>
      </div>
      <OrderTable orders={orders} />
    </div>
  );
}
