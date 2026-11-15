"use client";

import { Suspense } from "react";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { I18nProvider } from "@/lib/i18n/provider";
import type { CartItem } from "@/lib/types";

export function ShopShell({
  children,
  initialItems,
  locale,
}: {
  children: React.ReactNode;
  initialItems: CartItem[];
  locale: string;
}) {
  return (
    <I18nProvider initialLocale={locale}>
      <CartProvider initialItems={initialItems}>
        {children}
        <Suspense fallback={null}>
          <CartDrawer />
        </Suspense>
      </CartProvider>
    </I18nProvider>
  );
}
