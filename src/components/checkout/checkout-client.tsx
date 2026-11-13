"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Landmark, QrCode, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { createOrder } from "@/lib/actions/orders";
import { computeDiscount, isVoucherUsable } from "@/lib/vouchers";
import { formatIDR } from "@/lib/utils";
import type { Address, UserVoucher } from "@/lib/types";

const PAYMENT_METHODS = [
  { id: "bank_transfer", label: "Transfer Bank (VA)", icon: Landmark, hint: "Virtual Account dummy" },
  { id: "qris", label: "QRIS", icon: QrCode, hint: "Scan QR simulasi" },
  { id: "ewallet", label: "E-Wallet", icon: Wallet, hint: "GoPay/OVO/Dana" },
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];

export function CheckoutClient({
  addresses,
  userVouchers,
  subtotal,
}: {
  addresses: Address[];
  userVouchers: UserVoucher[];
  subtotal: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0] ?? null;
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    defaultAddress?.id ?? null,
  );
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");

  const [result, setResult] = useState<{
    orderId: string;
    reference: string;
    virtualAccount?: string;
  } | null>(null);

  const selectedVoucher = useMemo(() => {
    const uv = userVouchers.find((v) => v.id === selectedVoucherId);
    return uv?.vouchers ?? null;
  }, [selectedVoucherId, userVouchers]);

  const discount = computeDiscount(subtotal, selectedVoucher);
  const total = Math.max(subtotal - discount, 0);

  function placeOrder() {
    const address = addresses.find((a) => a.id === selectedAddressId);
    if (!address) {
      toast.error("Pilih alamat pengiriman terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      const res = await createOrder({
        address: {
          recipient_name: address.recipient_name,
          phone_number: address.phone_number,
          street_address: address.street_address,
          city: address.city,
          postal_code: address.postal_code,
        },
        userVoucherId: selectedVoucherId,
        paymentMethod,
      });

      if (!res.ok || !res.orderId) {
        toast.error(res.message);
        return;
      }

      setResult({
        orderId: res.orderId,
        reference: res.paymentReference ?? "",
        virtualAccount: res.virtualAccount,
      });
      toast.success("Pesanan dibuat. Selesaikan pembayaran.");
      router.refresh();
    });
  }

  if (addresses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-muted-foreground">
            Anda belum memiliki alamat pengiriman.
          </p>
          <Button onClick={() => router.push("/profile")}>
            Tambah Alamat di Profil
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Alamat Pengiriman</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    selectedAddressId === a.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    className="mt-1"
                    checked={selectedAddressId === a.id}
                    onChange={() => setSelectedAddressId(a.id)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.recipient_name}</span>
                      {a.is_default && <Badge tone="default">Utama</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{a.phone_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {a.street_address}, {a.city} {a.postal_code}
                    </p>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metode Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-3">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors ${
                    paymentMethod === m.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="sr-only"
                    checked={paymentMethod === m.id}
                    onChange={() => setPaymentMethod(m.id)}
                  />
                  <m.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{m.label}</span>
                  <span className="text-xs text-muted-foreground">{m.hint}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Voucher Saya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {userVouchers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada voucher.{" "}
                  <a href="/vouchers" className="text-primary hover:underline">
                    Klaim voucher
                  </a>
                </p>
              ) : (
                <>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary/50">
                    <input
                      type="radio"
                      name="voucher"
                      checked={selectedVoucherId === null}
                      onChange={() => setSelectedVoucherId(null)}
                    />
                    <span className="text-sm">Tanpa voucher</span>
                  </label>
                  {userVouchers.map((uv) => {
                    const v = uv.vouchers!;
                    const usable = !uv.is_used && isVoucherUsable(v, subtotal);
                    const label =
                      v.discount_type === "percentage"
                        ? `${Number(v.discount_value)}%`
                        : formatIDR(v.discount_value);
                    return (
                      <label
                        key={uv.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                          !usable
                            ? "cursor-not-allowed border-border opacity-50"
                            : selectedVoucherId === uv.id
                              ? "cursor-pointer border-primary bg-primary/5"
                              : "cursor-pointer border-border hover:bg-secondary/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="voucher"
                          disabled={!usable}
                          checked={selectedVoucherId === uv.id}
                          onChange={() => setSelectedVoucherId(uv.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold">
                              {v.code}
                            </span>
                            <Badge tone="info">{label}</Badge>
                            {uv.is_used && <Badge tone="danger">Terpakai</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Min. belanja {formatIDR(v.min_purchase)}
                            {!usable && !uv.is_used && " — subtotal belum mencukupi"}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="h-fit rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Ringkasan Pesanan</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatIDR(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-500">
                <dt>Diskon</dt>
                <dd>-{formatIDR(discount)}</dd>
              </div>
            )}
          </dl>
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-bold">
            <span>Total Bayar</span>
            <span className="text-primary">{formatIDR(total)}</span>
          </div>
          <Button className="mt-5 w-full" loading={pending} onClick={placeOrder}>
            <CreditCard className="h-4 w-4" /> Buat Pesanan
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Pembayaran masih berupa simulasi (placeholder gateway).
          </p>
        </aside>
      </div>

      <Modal
        open={!!result}
        onClose={() => {
          setResult(null);
          router.push("/orders");
        }}
        title="Instruksi Pembayaran"
      >
        {result && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pesanan <span className="font-mono">{result.reference}</span> berhasil
              dibuat dengan status <Badge tone="warning">Menunggu Pembayaran</Badge>.
            </p>

            {paymentMethod === "bank_transfer" && result.virtualAccount && (
              <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Virtual Account (dummy)
                </p>
                <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-primary">
                  {result.virtualAccount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bank Vibe • a.n. X-VIBE-SHOP
                </p>
              </div>
            )}

            {paymentMethod === "qris" && (
              <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-6 text-center">
                <QrCode className="mx-auto h-24 w-24 text-primary" />
                <p className="mt-2 text-xs text-muted-foreground">
                  Scan QR simulasi untuk membayar {formatIDR(total)}
                </p>
              </div>
            )}

            {paymentMethod === "ewallet" && (
              <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Kirim pembayaran ke akun e-wallet (dummy)
                </p>
                <p className="mt-1 font-mono text-xl font-bold text-primary">
                  0812-0000-0000
                </p>
              </div>
            )}

            <div className="rounded-md bg-secondary/60 p-3 text-xs text-muted-foreground">
              Buka halaman Pesanan lalu tekan <b>“Simulasikan Pembayaran”</b> untuk
              menandai pesanan sebagai Lunas (demo).
            </div>

            <Button
              className="w-full"
              onClick={() => {
                setResult(null);
                router.push("/orders");
              }}
            >
              Lihat Pesanan Saya
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
