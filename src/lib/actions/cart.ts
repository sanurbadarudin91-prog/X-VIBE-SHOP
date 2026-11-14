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

  // Keranjang unik per (user, produk, warna). Kolom `variant_color` hanya
  // disentuh bila memang ada warna terpilih, agar tetap jalan di DB yang belum
  // menjalankan migrasi varian.
  const existingQuery = supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId);
  const { data: existing } = await (variantColor
    ? existingQuery.eq("variant_color", variantColor)
    : existingQuery
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
        ...(variantColor ? { variant_color: variantColor } : {}),
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
    .select("product_id, products(*)")
    .eq("id", cartItemId)
    .eq("user_id", user.id)
    .single();

  // Warna dibaca terpisah: bila kolom `variant_color` belum ada (migrasi belum
  // jalan), pembacaan gagal dan cukup dianggap tanpa varian.
  let variantColor: string | null = null;
  const vc = await supabase
    .from("cart_items")
    .select("variant_color")
    .eq("id", cartItemId)
    .single();
  if (!vc.error)
    variantColor = (vc.data as { variant_color: string | null } | null)?.variant_color ?? null;

  const row = item as
    | { products: { stock: number; variant_stock?: Record<string, number> | null } | null }
    | null;

  const variantStock = row?.products?.variant_stock;
  const stock =
    variantColor && variantStock?.[variantColor] != null
      ? Number(variantStock[variantColor])
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
