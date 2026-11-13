"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, User, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "@/components/layout/search-bar";
import { CartButton } from "@/components/cart/cart-button";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export function Header({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
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
    { href: "/", label: "Beranda" },
    { href: "/products", label: "Katalog" },
    { href: "/vouchers", label: "Voucher" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
            X
          </span>
          <span className="hidden font-bold tracking-tight sm:block">
            X-VIBE<span className="text-primary">SHOP</span>
          </span>
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
          <ThemeToggle />
          <CartButton />

          {profile ? (
            <div className="hidden items-center gap-1 md:flex">
              {profile.role === "admin" && (
                <Button asChild variant="ghost" size="icon" title="Dashboard admin">
                  <Link href="/admin">
                    <LayoutDashboard className="h-5 w-5" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="icon" title="Profil">
                <Link href="/profile">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Keluar"
                onClick={handleLogout}
                loading={loggingOut}
              >
                {!loggingOut && <LogOut className="h-5 w-5" />}
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/login">Masuk</Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-3 md:hidden animate-fade-in">
          <SearchBar className="mb-3" />
          <nav className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
              >
                {l.label}
              </Link>
            ))}
            {profile?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
              >
                Dashboard Admin
              </Link>
            )}
            {profile ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
                >
                  Profil Saya
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
                >
                  Pesanan Saya
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-md px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-secondary"
                >
                  Keluar
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="mt-1 rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
              >
                Masuk / Daftar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
