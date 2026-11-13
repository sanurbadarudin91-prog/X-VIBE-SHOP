"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, ShippingAddress } from "@/lib/types";
import type { ActionResult } from "./cart";

export interface CheckoutInput {
  address: ShippingAddress;
  userVoucherId: string | null;
  paymentMethod: "bank_transfer" | "qris" | "ewallet";
}

export interface CheckoutResult extends ActionResult {
  orderId?: string;
  paymentReference?: string;
  virtualAccount?: string;
}

/** Transisi status pesanan yang sah untuk admin (fulfillment). */
const ADMIN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "completed", "cancelled"],
  shipped: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Silakan login terlebih dahulu." };

  // Pembuatan pesanan dijalankan atomik di database (validasi stok, voucher,
  // total, order_items, dan pengosongan keranjang) via RPC security-definer.
  const { data, error } = await supabase.rpc("create_order", {
    p_address: input.address,
    p_payment_method: input.paymentMethod,
    p_user_voucher_id: input.userVoucherId,
  });

  if (error) return { ok: false, message: error.message };

  const row = (Array.isArray(data) ? data[0] : data) as
    | { order_id: string; payment_reference: string }
    | undefined;
  if (!row?.order_id)
    return { ok: false, message: "Gagal membuat pesanan." };

  const [reference, vaPart] = row.payment_reference.split("|VA:");
  const virtualAccount =
    input.paymentMethod === "bank_transfer" ? vaPart : undefined;

  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath("/checkout");

  return {
    ok: true,
    message: "Pesanan berhasil dibuat.",
    orderId: row.order_id,
    paymentReference: reference,
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

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (!order) return { ok: false, message: "Pesanan tidak ditemukan." };
  if (order.status === status)
    return { ok: true, message: "Status pesanan tidak berubah." };
  if (!ADMIN_TRANSITIONS[order.status as OrderStatus].includes(status))
    return {
      ok: false,
      message: "Perubahan status tidak diizinkan dari status saat ini.",
    };

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true, message: "Status pesanan diperbarui." };
}
