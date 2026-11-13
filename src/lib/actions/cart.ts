"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: boolean; message: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function addToCart(
  productId: string,
  quantity = 1,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Silakan login terlebih dahulu." };

  const { data: product } = await supabase
    .from("products")
    .select("stock")
    .eq("id", productId)
    .single();

  if (!product) return { ok: false, message: "Produk tidak ditemukan." };

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  const newQty = (existing?.quantity ?? 0) + quantity;
  if (newQty > product.stock)
    return { ok: false, message: "Stok tidak mencukupi." };

  const { error } = existing
    ? await supabase
        .from("cart_items")
        .update({ quantity: newQty })
        .eq("id", existing.id)
    : await supabase
        .from("cart_items")
        .insert({ user_id: user.id, product_id: productId, quantity });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/cart");
  revalidatePath("/");
  return { ok: true, message: "Produk ditambahkan ke keranjang." };
}

export async function updateCartQuantity(
  cartItemId: string,
  quantity: number,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Silakan login terlebih dahulu." };

  if (quantity <= 0) return removeCartItem(cartItemId);

  const { data: item } = await supabase
    .from("cart_items")
    .select("product_id, products(stock)")
    .eq("id", cartItemId)
    .eq("user_id", user.id)
    .single();

  const stock =
    (item as { products: { stock: number } | null } | null)?.products?.stock ?? 0;
  if (quantity > stock)
    return { ok: false, message: `Stok tersisa hanya ${stock}.` };

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId)
    .eq("user_id", user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/cart");
  return { ok: true, message: "Kuantitas diperbarui." };
}

export async function removeCartItem(cartItemId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Silakan login terlebih dahulu." };

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId)
    .eq("user_id", user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/cart");
  return { ok: true, message: "Produk dihapus dari keranjang." };
}

export async function clearCart(): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Silakan login terlebih dahulu." };

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/cart");
  return { ok: true, message: "Keranjang dikosongkan." };
}
