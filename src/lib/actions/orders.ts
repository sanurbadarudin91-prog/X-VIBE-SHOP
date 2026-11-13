"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeDiscount } from "@/lib/vouchers";
import { generateOrderReference, generateVirtualAccount } from "@/lib/utils";
import type { OrderStatus, ShippingAddress, Voucher } from "@/lib/types";
import type { ActionResult } from "./cart";

export interface CheckoutInput {
  address: ShippingAddress;
  userVoucherId: string | null;
  paymentMethod: "bank_transfer" | "qris" | "ewallet";
}

/** Baris cart_items beserta relasi products yang di-embed PostgREST. */
interface CartRow {
  id: string;
  quantity: number;
  product_id: string;
  products: { id: string; title: string; price: number; stock: number } | null;
}

export interface CheckoutResult extends ActionResult {
  orderId?: string;
  paymentReference?: string;
  virtualAccount?: string;
}

export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Silakan login terlebih dahulu." };

  const { data: cartData } = await supabase
    .from("cart_items")
    .select("id, quantity, product_id, products(id, title, price, stock)")
    .eq("user_id", user.id);

  const cart = (cartData ?? []) as unknown as CartRow[];

  if (cart.length === 0)
    return { ok: false, message: "Keranjang Anda kosong." };

  // Validasi stok & hitung subtotal dari harga di server (bukan dari client).
  let subtotal = 0;
  for (const item of cart) {
    const product = item.products;
    if (!product) return { ok: false, message: "Ada produk yang tidak valid." };
    if (item.quantity > product.stock)
      return {
        ok: false,
        message: `Stok "${product.title}" tidak mencukupi (tersisa ${product.stock}).`,
      };
    subtotal += Number(product.price) * item.quantity;
  }

  // Hitung diskon voucher di server.
  let discount = 0;
  let userVoucherId: string | null = null;
  if (input.userVoucherId) {
    const { data: uv } = await supabase
      .from("user_vouchers")
      .select("id, is_used, vouchers(id, discount_type, discount_value, min_purchase, is_active, expiry_date)")
      .eq("id", input.userVoucherId)
      .eq("user_id", user.id)
      .single();

    const voucher = (uv as { vouchers: Voucher | null } | null)?.vouchers;
    if (uv && !uv.is_used && voucher) {
      discount = computeDiscount(subtotal, voucher);
      if (discount > 0) userVoucherId = uv.id;
    }
  }

  const total = Math.max(subtotal - discount, 0);
  const paymentReference = generateOrderReference();
  const virtualAccount =
    input.paymentMethod === "bank_transfer" ? generateVirtualAccount() : undefined;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      total_amount: total,
      status: "pending",
      shipping_address_json: input.address,
      payment_reference: virtualAccount
        ? `${paymentReference}|VA:${virtualAccount}`
        : paymentReference,
    })
    .select("id")
    .single();

  if (orderError || !order)
    return { ok: false, message: orderError?.message ?? "Gagal membuat pesanan." };

  const orderItems = cart.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price_at_purchase: Number(item.products?.price ?? 0),
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) return { ok: false, message: itemsError.message };

  if (userVoucherId) {
    await supabase
      .from("user_vouchers")
      .update({ is_used: true })
      .eq("id", userVoucherId)
      .eq("user_id", user.id);
  }

  await supabase.from("cart_items").delete().eq("user_id", user.id);

  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath("/checkout");

  return {
    ok: true,
    message: "Pesanan berhasil dibuat.",
    orderId: order.id,
    paymentReference,
    virtualAccount,
  };
}

/**
 * Simulasi pembayaran: menandai pesanan sebagai 'paid' dan mengurangi stok.
 * Di produksi, ini digantikan oleh webhook dari payment gateway.
 */
export async function simulatePayment(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Silakan login terlebih dahulu." };

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, user_id")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (!order) return { ok: false, message: "Pesanan tidak ditemukan." };
  if (order.status !== "pending")
    return { ok: false, message: "Pesanan sudah dibayar atau diproses." };

  // Pengurangan stok & perubahan status dijalankan lewat RPC security-definer
  // (RLS orders/products tidak mengizinkan customer menulis langsung).
  const { error: payError } = await supabase.rpc("pay_order", {
    p_order_id: orderId,
  });
  if (payError) return { ok: false, message: payError.message };

  revalidatePath("/orders");
  revalidatePath("/");
  return { ok: true, message: "Pembayaran berhasil disimulasikan. Pesanan ditandai Lunas." };
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Silakan login terlebih dahulu." };

  const { error } = await supabase.rpc("cancel_order", { p_order_id: orderId });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/orders");
  revalidatePath("/");
  return { ok: true, message: "Pesanan dibatalkan." };
}

/** Admin: ubah status pesanan (fulfillment). */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Silakan login terlebih dahulu." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return { ok: false, message: "Akses ditolak. Hanya admin." };

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true, message: "Status pesanan diperbarui." };
}
