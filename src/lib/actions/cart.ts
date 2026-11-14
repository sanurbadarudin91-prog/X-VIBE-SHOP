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
  variantColor: string | null = null,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Silakan login terlebih dahulu." };

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (!product) return { ok: false, message: "Produk tidak ditemukan." };

  const p = product as {
    stock: number;
    colors: string[] | null;
    variant_stock: Record<string, number> | null;
  };
  const colors = p.colors ?? [];

  // Produk bervarian wajib memilih warna; stok mengikuti varian tersebut.
  if (colors.length > 0 && !variantColor)
    return { ok: false, message: "Silakan pilih warna terlebih dahulu." };
  if (variantColor && colors.length > 0 && !colors.includes(variantColor))
    return { ok: false, message: "Warna tidak tersedia untuk produk ini." };

  const available =
    variantColor && p.variant_stock && variantColor in p.variant_stock
      ? Number(p.variant_stock[variantColor])
      : p.stock;

  // Keranjang unik per (user, produk, warna). Filter warna eksplisit agar
  // produk tanpa varian (NULL) tetap ketemu.
  const existingQuery = supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId);
  const { data: existing } = await (variantColor
    ? existingQuery.eq("variant_color", variantColor)
    : existingQuery.is("variant_color", null)
  ).maybeSingle();

  const newQty = (existing?.quantity ?? 0) + quantity;
  if (newQty > available)
    return {
      ok: false,
      message: `Stok${variantColor ? ` warna ${variantColor}` : ""} tersisa ${available}.`,
    };

  const { error } = existing
    ? await supabase
        .from("cart_items")
        .update({ quantity: newQty })
        .eq("id", existing.id)
    : await supabase.from("cart_items").insert({
        user_id: user.id,
        product_id: productId,
        quantity,
        variant_color: variantColor,
      });

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
    .select("product_id, variant_color, products(*)")
    .eq("id", cartItemId)
    .eq("user_id", user.id)
    .single();

  const row = item as
    | {
        variant_color: string | null;
        products: {
          stock: number;
          variant_stock: Record<string, number> | null;
        } | null;
      }
    | null;

  const stock =
    row?.variant_color && row.products?.variant_stock?.[row.variant_color] != null
      ? Number(row.products.variant_stock[row.variant_color])
      : row?.products?.stock ?? 0;

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
