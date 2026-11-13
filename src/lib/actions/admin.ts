"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
  price: number;
  stock: number;
  category: string;
  image_url: string;
}

export async function saveProduct(input: ProductInput): Promise<ActionResult> {
  const { supabase, ok, message } = await requireAdmin();
  if (!ok) return { ok: false, message };

  const payload = {
    title: input.title.trim(),
    description: input.description.trim(),
    price: Number(input.price),
    stock: Number(input.stock),
    category: input.category.trim() || "Apparel",
    image_url: input.image_url.trim() || null,
  };

  if (!payload.title) return { ok: false, message: "Nama produk wajib diisi." };
  if (payload.price < 0 || payload.stock < 0)
    return { ok: false, message: "Harga dan stok tidak boleh negatif." };

  const { error } = input.id
    ? await supabase.from("products").update(payload).eq("id", input.id)
    : await supabase.from("products").insert(payload);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products");
  return { ok: true, message: input.id ? "Produk diperbarui." : "Produk ditambahkan." };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const { supabase, ok, message } = await requireAdmin();
  if (!ok) return { ok: false, message };

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/");
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
