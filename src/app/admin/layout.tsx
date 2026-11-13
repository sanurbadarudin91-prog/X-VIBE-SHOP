import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  TicketPercent,
} from "lucide-react";
import { getProfile } from "@/lib/queries";

const NAV = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/orders", label: "Pesanan", icon: ShoppingCart },
  { href: "/admin/vouchers", label: "Voucher", icon: TicketPercent },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              X
            </span>
            <span className="text-sm font-semibold">Admin Panel</span>
          </Link>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Store className="h-4 w-4" /> Lihat Toko
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-20 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <nav className="mb-4 flex gap-1 overflow-x-auto no-scrollbar lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex shrink-0 items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          {children}
        </div>
      </div>
    </div>
  );
}
