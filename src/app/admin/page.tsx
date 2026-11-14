import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAdminOrders,
  getAdminStats,
  getLowStockProducts,
  getRevenueSeries,
} from "@/lib/queries";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { formatDate, formatIDR } from "@/lib/utils";

export const metadata = { title: "Dashboard Admin" };

const STATUS_TONE: Record<
  OrderStatus,
  "default" | "success" | "warning" | "danger" | "info" | "muted"
> = {
  pending: "warning",
  paid: "info",
  shipped: "default",
  completed: "success",
  cancelled: "danger",
};

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "completed",
  "cancelled",
];

export default async function AdminOverviewPage() {
  const [stats, series, lowStock, orders] = await Promise.all([
    getAdminStats(),
    getRevenueSeries(7),
    getLowStockProducts(5),
    getAdminOrders(),
  ]);

  const recentOrders = orders.slice(0, 5);
  const maxRevenue = Math.max(...series.map((p) => p.total), 1);

  const cards = [
    {
      label: "Total Pendapatan",
      value: formatIDR(stats.revenue),
      icon: DollarSign,
      hint: `Rata-rata ${formatIDR(stats.averageOrderValue)}/pesanan`,
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
      hint: `${lowStock.length} produk stok menipis`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Pendapatan 7 Hari</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-2">
              {series.map((p) => (
                <div key={p.date} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-md bg-primary/80 transition-all"
                    style={{
                      height: `${Math.max(
                        (p.total / maxRevenue) * 100,
                        p.total > 0 ? 6 : 2,
                      )}%`,
                    }}
                    title={formatIDR(p.total)}
                  />
                  <span className="text-xs text-muted-foreground">{p.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Total 7 hari:{" "}
              <span className="font-medium text-foreground">
                {formatIDR(series.reduce((s, p) => s + p.total, 0))}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {STATUS_ORDER.map((s) => (
              <div key={s} className="flex items-center justify-between">
                <Badge tone={STATUS_TONE[s]}>{ORDER_STATUS_LABELS[s]}</Badge>
                <span className="text-sm font-semibold">
                  {stats.statusCounts[s]}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Pesanan Terbaru</CardTitle>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Belum ada pesanan masuk.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {recentOrders.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs font-semibold">
                        {o.payment_reference?.split("|")[0] ?? o.id.slice(0, 8)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {o.profiles?.full_name ?? "Pelanggan"} ·{" "}
                        {formatDate(o.created_at)}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {formatIDR(o.total_amount)}
                    </span>
                    <Badge tone={STATUS_TONE[o.status]}>
                      {ORDER_STATUS_LABELS[o.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base">Stok Menipis</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Semua stok aman (di atas 5).
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {p.title}
                    </span>
                    <Badge tone={p.stock === 0 ? "danger" : "warning"}>
                      {p.stock === 0 ? "Habis" : `${p.stock} tersisa`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/admin/products"
              className="mt-3 inline-block text-xs text-muted-foreground hover:text-foreground"
            >
              Kelola produk
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
