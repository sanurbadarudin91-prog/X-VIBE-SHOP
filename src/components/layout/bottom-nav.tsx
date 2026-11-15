"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import type { MessageKey } from "@/lib/i18n/dictionaries";

const ITEMS: {
  href: string;
  labelKey: MessageKey;
  icon: typeof Home;
  match: (path: string) => boolean;
}[] = [
  { href: "/", labelKey: "nav.home", icon: Home, match: (p) => p === "/" },
  {
    href: "/products",
    labelKey: "nav.catalog",
    icon: LayoutGrid,
    match: (p) => p.startsWith("/products"),
  },
  {
    href: "/profile",
    labelKey: "nav.profile",
    icon: User,
    match: (p) => p.startsWith("/profile") || p.startsWith("/orders"),
  },
];

/**
 * Navigasi bawah ala aplikasi mobile: fixed, hanya tampil di layar kecil.
 * Berisi Beranda, Katalog, Keranjang (membuka drawer), dan Profil.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { count, setOpen } = useCart();
  const { t } = useI18n();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {ITEMS.slice(0, 2).map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {t(item.labelKey)}
                {active && (
                  <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            </li>
          );
        })}

        {/* Keranjang: membuka drawer, bukan halaman terpisah */}
        <li>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t("nav.cart")}
            className="relative flex w-full flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="relative">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </span>
            {t("nav.cart")}
          </button>
        </li>

        {ITEMS.slice(2).map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {t(item.labelKey)}
                {active && (
                  <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
