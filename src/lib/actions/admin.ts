"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MAX_PRODUCT_IMAGES } from "@/lib/product-constants";
import type { DiscountType } from "@/lib/types";
import type { ActionResult } from "./cart";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const, message: "Tidak terautentikasi." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return { supabase, ok: false as const, message: "Akses ditolak. Hanya admin." };

  return { supabase, ok: true as const, message: "" };
}

export interface ProductInput {
  id?: string;
  title: string;
  description: string;
  caption: string;
  price: number;
  stock: number;
  category: string;
  image_url: string;
  images: string[];
  colors: string[];
  variant_stock: Record<string, number>;
}

export async function saveProduct(input: ProductInput): Promise<ActionResult> {
  const { supabase, ok, message } = await requireAdmin();
  if (!ok) return { ok: false, message };

  const images = Array.from(new Set((input.images ?? []).map((s) => s.trim()).filter(Boolean)));
  if (images.length > MAX_PRODUCT_IMAGES)
    return { ok: false, message: `Maksimal ${MAX_PRODUCT_IMAGES} foto per produk.` };

  // Normalisasi varian: hanya warna unik dengan stok bilangan bulat >= 0.
  const colors: string[] = [];
  const variantStock: Record<string, number> = {};
  for (const raw of input.colors ?? []) {
    const color = raw.trim();
    if (!color || colors.includes(color)) continue;
    colors.push(color);
    const qty = Math.max(0, Math.floor(Number(input.variant_stock?.[raw] ?? 0) || 0));
    variantStock[color] = qty;
  }

  // Bila ada varian warna, stok total = jumlah stok seluruh varian.
  const stock = colors.length
    ? colors.reduce((sum, c) => sum + variantStock[c], 0)
    : Math.max(0, Math.floor(Number(input.stock) || 0));

  const payload = {
    title: input.title.trim(),
    description: input.description.trim() || null,
    caption: input.caption.trim() || null,
    price: Number(input.price),
    stock,
    category: input.category.trim() || "Apparel",
    image_url: images[0] ?? (input.image_url.trim() || null),
    images,
    colors,
    variant_stock: variantStock,
  };

  if (!payload.title) return { ok: false, message: "Nama produk wajib diisi." };
  if (payload.price < 0) return { ok: false, message: "Harga tidak boleh negatif." };

  const { error } = input.id
    ? await supabase.from("products").update(payload).eq("id", input.id)
    : await supabase.from("products").insert(payload);

  if (error) {
    // 42703 = kolom belum ada (migrasi varian belum diterapkan ke DB ini).
    if (error.code === "42703")
      return {
        ok: false,
        message:
          "Skema database belum mendukung galeri/varian. Jalankan migrasi " +
          "supabase/migrations/20261114_product_variants.sql di Supabase, lalu coba lagi.",
      };
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products");
  return { ok: true, message: input.id ? "Produk diperbarui." : "Produk ditambahkan." };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const { supabase, ok, message } = await requireAdmin();
  if (!ok) return { ok: false, message };

  // Ambil dulu URL foto agar file di storage bisa dibersihkan setelah hapus.
  // Bila kolom `images` belum ada (migrasi belum jalan), cukup pakai image_url.
  let media = await supabase
    .from("products")
    .select("image_url, images")
    .eq("id", id)
    .maybeSingle();
  if (media.error?.code === "42703") {
    media = await supabase
      .from("products")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  const saved = media.data as {
    image_url: string | null;
    images?: string[] | null;
  } | null;

  const urls = new Set<string>(
    [saved?.image_url ?? null, ...(saved?.images ?? [])].filter(Boolean) as string[],
  );
  const paths = Array.from(urls)
    .map((u) => u.split("/product-images/")[1]?.split("?")[0])
    .filter(Boolean) as string[];

  if (paths.length) {
    // Best-effort: kegagalan pembersihan storage tidak menggagalkan penghapusan.
    await supabase.storage.from("product-images").remove(paths);
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products");
  return { ok: true, message: "Produk dihapus." };
}

export interface VoucherInput {
  id?: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase: number;
  expiry_date: string | null;
  is_active: boolean;
}

export async function saveVoucher(input: VoucherInput): Promise<ActionResult> {
  const { supabase, ok, message } = await requireAdmin();
  if (!ok) return { ok: false, message };

  const payload = {
    code: input.code.trim().toUpperCase(),
    discount_type: input.discount_type,
    discount_value: Number(input.discount_value),
    min_purchase: Number(input.min_purchase),
    expiry_date: input.expiry_date || null,
    is_active: input.is_active,
  };

  if (!payload.code) return { ok: false, message: "Kode voucher wajib diisi." };
  if (payload.discount_value < 0 || payload.min_purchase < 0)
    return { ok: false, message: "Nilai diskon/min belanja tidak boleh negatif." };

  const { error } = input.id
    ? await supabase.from("vouchers").update(payload).eq("id", input.id)
    : await supabase.from("vouchers").insert(payload);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/vouchers");
  revalidatePath("/vouchers");
  return { ok: true, message: input.id ? "Voucher diperbarui." : "Voucher dibuat." };
}

export async function deleteVoucher(id: string): Promise<ActionResult> {
  const { supabase, ok, message } = await requireAdmin();
  if (!ok) return { ok: false, message };

  const { error } = await supabase.from("vouchers").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/vouchers");
  revalidatePath("/vouchers");
  return { ok: true, message: "Voucher dihapus." };
}
