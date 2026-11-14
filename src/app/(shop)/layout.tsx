import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ShopShell } from "@/components/layout/shop-shell";
import { getCart, getProfile } from "@/lib/queries";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, cartItems] = await Promise.all([getProfile(), getCart()]);

  return (
    <ShopShell initialItems={cartItems}>
      <div className="flex min-h-screen flex-col">
        <Header profile={profile} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ShopShell>
  );
}
