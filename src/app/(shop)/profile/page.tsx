import Link from "next/link";
import { ArrowRight, LayoutDashboard, Package, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { AddressManager } from "@/components/profile/address-manager";
import { LogoutButton } from "@/components/profile/logout-button";
import { OrderCard } from "@/components/order-card";
import { getAddresses, getMyOrders, getProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { getTranslator } from "@/lib/i18n/server";
import { clientKey, isConfigured, isProduction } from "@/lib/payments/midtrans";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Profil Saya" };

export default async function ProfilePage() {
  const [profile, addresses, orders, { t }] = await Promise.all([
    getProfile(),
    getAddresses(),
    getMyOrders(),
    getTranslator(),
  ]);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!profile || !user) return null;

  const isAdmin = profile.role === "admin";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{t("profile.title")}</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <AvatarUploader
                userId={profile.id}
                avatarUrl={profile.avatar_url}
                fullName={profile.full_name}
              />
              <div className="text-center">
                <p className="font-semibold">{profile.full_name ?? "Tanpa nama"}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <Badge tone={isAdmin ? "default" : "muted"}>
                    {isAdmin ? "Admin" : "Customer"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Bergabung {formatDate(profile.created_at)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pintasan terintegrasi: Pesanan Saya & Dashboard Admin */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">{t("profile.shortcuts")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild variant="outline" className="justify-start rounded-xl">
                <Link href="/orders">
                  <Package className="h-4 w-4" /> {t("profile.orders")}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {orders.length}
                  </span>
                </Link>
              </Button>
              {isAdmin && (
                <Button asChild variant="outline" className="justify-start rounded-xl">
                  <Link href="/admin">
                    <LayoutDashboard className="h-4 w-4" /> {t("profile.admin")}
                  </Link>
                </Button>
              )}
              {isAdmin && (
                <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Akses admin aktif
                </p>
              )}

              <div className="my-1 h-px bg-border" />
              <p className="px-1 text-xs text-muted-foreground">
                {t("profile.logoutDesc")}
              </p>
              <LogoutButton />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Data Diri</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm profile={profile} email={user.email ?? ""} />
            </CardContent>
          </Card>

          {/* Pesanan Saya diintegrasikan langsung ke halaman profil */}
          <Card className="rounded-2xl">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">{t("profile.orders")}</CardTitle>
              <Link
                href="/orders"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {t("home.viewAll")} <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
                  <Package className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("orders.empty")}
                  </p>
                  <Button asChild className="mt-4 rounded-full" size="sm">
                    <Link href="/products">{t("cart.startShopping")}</Link>
                  </Button>
                </div>
              ) : (
                orders
                  .slice(0, 3)
                  .map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      midtransEnabled={isConfigured()}
                      midtransClientKey={clientKey()}
                      midtransProduction={isProduction()}
                    />
                  ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <AddressManager addresses={addresses} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
