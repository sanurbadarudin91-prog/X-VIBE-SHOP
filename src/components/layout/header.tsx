"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { BrandWordmark } from "@/components/layout/brand-logo";
import { SearchBar } from "@/components/layout/search-bar";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/provider";
import type { Profile } from "@/lib/types";

export function Header({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const { t } = useI18n();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Berhasil keluar.");
    router.push("/");
    router.refresh();
  }

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/products", label: t("nav.catalog") },
    { href: "/vouchers", label: t("nav.vouchers") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" aria-label="X-VIBE-SHOP" className="shrink-0">
          <BrandWordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden flex-1 justify-end md:flex">
          <SearchBar className="max-w-xs" />
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <LanguageSwitcher compact />
          <ThemeToggle />

          {profile ? (
            <>
              <Button asChild variant="ghost" size="icon" title={t("nav.profile")}>
                <Link href="/profile">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={t("nav.logout")}
                onClick={handleLogout}
                loading={loggingOut}
              >
                {!loggingOut && <LogOut className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">{t("nav.login")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
