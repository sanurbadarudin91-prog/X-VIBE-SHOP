"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  variantStock as resolveVariantStock,
  variantLabel,
  type VariantSource,
} from "@/lib/variants";

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
  variantSize: string | null = null,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Silakan login terlebih dahulu." };
  const userId = user.id;

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (!product) return { ok: false, message: "Produk tidak ditemukan." };

  const p = product as {
    stock: number;
    colors: string[] | null;
    sizes: string[] | null;
    variant_stock: Record<string, number> | null;
  };
  const colors = p.colors ?? [];
  const sizes = p.sizes ?? [];

  // Produk bervarian wajib memilih opsi; stok mengikuti kombinasi varian.
  if (colors.length > 0 && !variantColor)
    return { ok: false, message: "Silakan pilih warna terlebih dahulu." };
  if (variantColor && colors.length > 0 && !colors.includes(variantColor))
    return { ok: false, message: "Warna tidak tersedia untuk produk ini." };
  if (sizes.length > 0 && !variantSize)
    return { ok: false, message: "Silakan pilih ukuran terlebih dahulu." };
  if (variantSize && sizes.length > 0 && !sizes.includes(variantSize))
    return { ok: false, message: "Ukuran tidak tersedia untuk produk ini." };

  const available = resolveVariantStock(
    { stock: p.stock, variant_stock: p.variant_stock ?? {} },
    variantColor,
    variantSize,
  );

  // Keranjang unik per (user, produk, warna, ukuran). Kolom varian hanya
  // disentuh bila memang ada nilai, agar tetap jalan di DB yang belum
  // menjalankan migrasi varian.
  function findExisting() {
    const q = supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("product_id", productId);
    if (variantColor) q.eq("variant_color", variantColor);
    if (variantSize) q.eq("variant_size", variantSize);
    return q.maybeSingle();
  }

  const found = await findExisting();
  let existing = found.data;
  const findError = found.error;
  // 42703 = kolom varian belum ada di DB ini; cari tanpa filter varian.
  if (findError?.code === "42703") {
    ({ data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle());
  }

  const newQty = (existing?.quantity ?? 0) + quantity;
  if (newQty > available)
    return {
      ok: false,
      message: `Stok${
        variantLabel(variantColor, variantSize)
          ? ` ${variantLabel(variantColor, variantSize)}`
          : ""
      } tersisa ${available}.`,
    };

  const { error } = existing
    ? await supabase
        .from("cart_items")
        .update({ quantity: newQty })
        .eq("id", existing.id)
    : await supabase.from("cart_items").insert({
        user_id: userId,
        product_id: productId,
        quantity,
        ...(variantColor ? { variant_color: variantColor } : {}),
        ...(variantSize ? { variant_size: variantSize } : {}),
      });

  if (error) {
    // 42703 = kolom varian belum ada (migrasi varian belum dijalankan).
    if (error.code === "42703" && (variantColor || variantSize))
      return {
        ok: false,
        message:
          "Varian warna/ukuran belum aktif di database. Jalankan migrasi " +
          "supabase/migrations/20261120_product_sizes_hex.sql di Supabase.",
      };
    return { ok: false, message: error.message };
  }

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
    .select("products(*)")
    .eq("id", cartItemId)
    .eq("user_id", user.id)
    .single();

  // Kolom varian dibaca terpisah: bila belum ada (migrasi belum jalan),
  // kegagalan cukup dianggap tanpa varian.
  let variantColor: string | null = null;
  let variantSize: string | null = null;
  const variant = await supabase
    .from("cart_items")
    .select("variant_color, variant_size")
    .eq("id", cartItemId)
    .single();
  if (!variant.error) {
    const row = variant.data as {
      variant_color: string | null;
      variant_size: string | null;
    } | null;
    variantColor = row?.variant_color ?? null;
    variantSize = row?.variant_size ?? null;
  }

  const product = (item as { products: VariantSource | null } | null)?.products;
  if (!product) return { ok: false, message: "Produk tidak ditemukan." };

  const stock = resolveVariantStock(product, variantColor, variantSize);

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
