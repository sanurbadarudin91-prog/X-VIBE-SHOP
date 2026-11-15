import { CustomerTable } from "@/components/admin/customer-table";
import { getAdminCustomers } from "@/lib/queries";

export const metadata = { title: "Manajemen Pelanggan" };

export default async function AdminCustomersPage() {
  const customers = await getAdminCustomers();
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Pelanggan</h1>
        <p className="text-sm text-muted-foreground">
          {customers.length} pelanggan terdaftar.
        </p>
      </div>
      <CustomerTable customers={customers} />
    </div>
  );
}
