import crypto from "node:crypto";
import { Snap } from "midtrans-client";
import type { SnapTransactionParameters } from "midtrans-client";

/**
 * Konfigurasi Midtrans diambil dari environment. Sandbox dipakai bila
 * MIDTRANS_IS_PRODUCTION bukan "true".
 */
export function isProduction() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

export function isConfigured() {
  return Boolean(process.env.MIDTRANS_SERVER_KEY);
}

export function clientKey() {
  return process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";
}

let snapInstance: Snap | null = null;

function snap() {
  if (!snapInstance) {
    snapInstance = new Snap({
      isProduction: isProduction(),
      serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
      clientKey: clientKey(),
    });
  }
  return snapInstance;
}

export interface SnapItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface SnapTransactionInput {
  /** ID pesanan internal (uuid) — dipakai juga sebagai order_id Midtrans. */
  orderId: string;
  /** Angka total dalam rupiah (bukan format mata uang). */
  grossAmount: number;
  items?: SnapItem[];
  customer?: {
    first_name?: string;
    email?: string;
    phone?: string;
  };
  enabledPayments?: string[];
}

export interface SnapTransaction {
  token: string;
  redirect_url: string;
  midtransOrderId: string;
}

/**
 * Membuat transaksi Snap. `order_id` Midtrans diberi prefix + uuid agar unik
 * dan mudah ditelusuri, serta muat dalam batas 50 karakter Midtrans.
 */
export async function createSnapTransaction(
  input: SnapTransactionInput,
): Promise<SnapTransaction> {
  const midtransOrderId = `XV-${input.orderId}`.slice(0, 50);

  const parameters: SnapTransactionParameters & {
    credit_card?: { secure: boolean };
    item_details?: {
      id: string;
      name: string;
      price: number;
      quantity: number;
    }[];
    customer_details?: {
      first_name?: string;
      email?: string;
      phone?: string;
    };
    enabled_payments?: string[];
  } = {
    transaction_details: {
      order_id: midtransOrderId,
      gross_amount: Math.round(input.grossAmount),
    },
    credit_card: { secure: true },
  };

  if (input.items?.length) {
    parameters.item_details = input.items.map((it) => ({
      id: it.id.slice(0, 50),
      name: it.name.slice(0, 50),
      price: Math.round(it.price),
      quantity: it.quantity,
    }));
  }

  if (input.customer && Object.keys(input.customer).length) {
    parameters.customer_details = input.customer;
  }

  if (input.enabledPayments?.length) {
    parameters.enabled_payments = input.enabledPayments;
  }

  const result = (await snap().createTransaction(parameters)) as {
    token: string;
    redirect_url: string;
  };

  return {
    token: result.token,
    redirect_url: result.redirect_url,
    midtransOrderId,
  };
}

export interface MidtransNotification {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_id?: string;
  transaction_time?: string;
  custom_field1?: string;
}

/**
 * Verifikasi signature notifikasi Midtrans:
 * sha512(order_id + status_code + gross_amount + serverKey).
 */
export function verifySignature(payload: MidtransNotification): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  if (!serverKey || !payload.signature_key) return false;

  const raw = `${payload.order_id ?? ""}${payload.status_code ?? ""}${
    payload.gross_amount ?? ""
  }${serverKey}`;
  const expected = crypto.createHash("sha512").update(raw).digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(payload.signature_key, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Terjemahkan status notifikasi Midtrans menjadi keputusan internal.
 * Mengembalikan "paid", "cancelled", atau "ignored" (status netral/pending).
 */
export function resolveNotificationOutcome(
  payload: MidtransNotification,
): "paid" | "cancelled" | "ignored" {
  const status = payload.transaction_status;
  const fraud = payload.fraud_status;

  if (status === "capture") {
    return fraud === "challenge" ? "ignored" : "paid";
  }
  if (status === "settlement") return "paid";
  if (status === "cancel" || status === "deny" || status === "expire") {
    return "cancelled";
  }
  return "ignored";
}
