import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolveNotificationOutcome,
  verifySignature,
  type MidtransNotification,
} from "@/lib/payments/midtrans";

/**
 * Webhook notifikasi Midtrans.
 *
 * 1. Verifikasi signature (sha512 order_id+status_code+gross_amount+serverKey).
 * 2. Cocokkan nominal dengan total pesanan.
 * 3. Perbarui status lewat RPC service_role (idempotent).
 *
 * Selalu balas 200 untuk notifikasi valid agar Midtrans tidak mengirim ulang,
 * kecuali saat signature/nominal tidak cocok (401/400).
 */
export async function POST(request: Request) {
  let payload: MidtransNotification;
  try {
    payload = (await request.json()) as MidtransNotification;
  } catch {
    return NextResponse.json({ message: "Body bukan JSON." }, { status: 400 });
  }

  if (!verifySignature(payload)) {
    return NextResponse.json({ message: "Signature tidak valid." }, { status: 401 });
  }

  // order_id Midtrans berformat "XV-<uuid>"; ambil uuid-nya kembali.
  const midtransOrderId = payload.order_id ?? "";
  const orderId = midtransOrderId.startsWith("XV-")
    ? midtransOrderId.slice(3)
    : midtransOrderId;

  if (!orderId) {
    return NextResponse.json({ message: "order_id tidak ada." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, total_amount, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    // Balas 200 agar Midtrans berhenti mencoba; pesanan tidak dikenal.
    return NextResponse.json({ message: "Pesanan tidak ditemukan." });
  }

  // Pastikan nominal notifikasi sama dengan total pesanan.
  const notified = Math.round(Number(payload.gross_amount ?? 0));
  const expected = Math.round(Number(order.total_amount));
  if (notified !== expected) {
    return NextResponse.json(
      { message: "Nominal tidak cocok dengan total pesanan." },
      { status: 400 },
    );
  }

  const outcome = resolveNotificationOutcome(payload);

  if (outcome === "paid") {
    const { error } = await supabase.rpc("mark_order_paid_from_gateway", {
      p_order_id: orderId,
      p_midtrans_order_id: midtransOrderId,
      p_paid_at: payload.transaction_time
        ? new Date(payload.transaction_time).toISOString()
        : new Date().toISOString(),
    });
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "Pesanan ditandai lunas." });
  }

  if (outcome === "cancelled") {
    const { error } = await supabase.rpc("mark_order_cancelled_from_gateway", {
      p_order_id: orderId,
    });
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "Pesanan dibatalkan." });
  }

  // Status netral (pending/authorize/challenge) — tidak mengubah apa pun.
  return NextResponse.json({ message: "Status diabaikan.", status: payload.transaction_status });
}

export async function GET() {
  return NextResponse.json({ status: "ok", provider: "midtrans" });
}
