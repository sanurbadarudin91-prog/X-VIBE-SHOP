import Link from "next/link";
import { Package, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { AddressManager } from "@/components/profile/address-manager";
import { getAddresses, getProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Profil Saya" };

export default async function ProfilePage() {
  const profile = await getProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const addresses = await getAddresses();

  if (!profile || !user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Profil Saya</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
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
                  <Badge tone={profile.role === "admin" ? "default" : "muted"}>
                    {profile.role === "admin" ? "Admin" : "Customer"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Bergabung {formatDate(profile.created_at)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pintasan</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/orders">
                  <Package className="h-4 w-4" /> Pesanan Saya
                </Link>
              </Button>
              {profile.role === "admin" && (
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/admin">
                    <ShieldCheck className="h-4 w-4" /> Dashboard Admin
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Data Diri</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm profile={profile} email={user.email ?? ""} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <AddressManager addresses={addresses} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
