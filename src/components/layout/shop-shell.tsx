"use client";

import { Suspense } from "react";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import type { CartItem } from "@/lib/types";

export function ShopShell({
  children,
  initialItems,
}: {
  children: React.ReactNode;
  initialItems: CartItem[];
}) {
  return (
    <CartProvider initialItems={initialItems}>
      {children}
      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
    </CartProvider>
  );
}
