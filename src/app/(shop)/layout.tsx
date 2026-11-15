import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ShopShell } from "@/components/layout/shop-shell";
import { getCart, getProfile } from "@/lib/queries";
import { getLocale } from "@/lib/i18n/server";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, cartItems, locale] = await Promise.all([
    getProfile(),
    getCart(),
    getLocale(),
  ]);

  return (
    <ShopShell initialItems={cartItems} locale={locale}>
      <div className="flex min-h-screen flex-col">
        <Header profile={profile} />
        {/* Padding bawah agar konten tidak tertutup bottom nav di mobile. */}
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <Footer />
        <BottomNav />
      </div>
    </ShopShell>
  );
}
