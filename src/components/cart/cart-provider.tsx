"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/lib/types";

interface CartContextValue {
  items: CartItem[];
  count: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
  initialItems,
}: {
  children: React.ReactNode;
  initialItems: CartItem[];
}) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [open, setOpen] = useState(false);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  async function refresh() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setItems([]);
      return;
    }
    const { data } = await supabase
      .from("cart_items")
      .select("*, products(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setItems((data as CartItem[]) ?? []);
  }

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  return (
    <CartContext.Provider value={{ items, count, open, setOpen, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart harus dipakai di dalam CartProvider");
  return ctx;
}
