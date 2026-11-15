"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useOptionalI18n } from "@/lib/i18n/provider";

export function LogoutButton() {
  const router = useRouter();
  const { t } = useOptionalI18n();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Berhasil keluar.");
    router.push("/");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      className="w-full justify-start rounded-xl text-destructive hover:text-destructive"
      onClick={handleLogout}
      loading={loggingOut}
    >
      {!loggingOut && <LogOut className="h-4 w-4" />}
      {t("profile.logout")}
    </Button>
  );
}
