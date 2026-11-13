import Link from "next/link";
import { ArrowRight, DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAdminStats } from "@/lib/queries";
import { formatIDR } from "@/lib/utils";

export const metadata = { title: "Dashboard Admin" };

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  const cards = [
    {
      label: "Total Pendapatan",
      value: formatIDR(stats.revenue),
      icon: DollarSign,
      hint: "Dari pesanan lunas/dikirim/selesai",
    },
    {
      label: "Total Pesanan",
      value: String(stats.orderCount),
      icon: ShoppingCart,
      hint: `${stats.pendingCount} menunggu pembayaran`,
    },
    {
      label: "Total Pelanggan",
      value: String(stats.customerCount),
      icon: Users,
      hint: "Akun dengan role customer",
    },
    {
      label: "Total Produk",
      value: String(stats.productCount),
      icon: Package,
      hint: "Produk aktif di katalog",
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ringkasan</h1>
          <p className="text-sm text-muted-foreground">
            Statistik toko X-VIBE-SHOP secara real-time.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/orders">
            Kelola Pesanan <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {c.label}
                </CardTitle>
                <c.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
