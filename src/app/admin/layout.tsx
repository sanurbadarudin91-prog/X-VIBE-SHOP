import Link from "next/link";
import { redirect } from "next/navigation";
import { Store } from "lucide-react";
import { BrandWordmark } from "@/components/layout/brand-logo";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getProfile } from "@/lib/queries";

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
          <Link href="/admin" className="flex items-center gap-2">
            <BrandWordmark />
          </Link>
          <span className="hidden rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground sm:inline">
            Admin Panel
          </span>
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
          <AdminSidebar />
        </aside>

        <div className="min-w-0 flex-1">
          <AdminSidebar variant="topbar" />
          {children}
        </div>
      </div>
    </div>
  );
}
