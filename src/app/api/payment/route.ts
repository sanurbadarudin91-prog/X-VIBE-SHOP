import { NextResponse } from "next/server";

/**
 * Placeholder Payment Gateway.
 *
 * Di produksi, endpoint ini menerima webhook dari Midtrans/Xendit, memverifikasi
 * signature, lalu memperbarui status pesanan menjadi 'paid'.
 * Saat ini hanya mengembalikan respons contoh agar alur checkout dapat diuji.
 */
export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json({
    provider: process.env.PAYMENT_PROVIDER ?? "mock",
    status: "pending",
    message:
      "Placeholder gateway. Integrasikan Midtrans/Xendit di sini untuk produksi.",
    received: body,
  });
}

export async function GET() {
  return NextResponse.json({
    provider: process.env.PAYMENT_PROVIDER ?? "mock",
    status: "ok",
  });
}
