"use client";

import { useEffect, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  cancelOrder,
  createSnapSession,
  simulatePayment,
} from "@/lib/actions/orders";
import { formatDate, formatIDR } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from "@/lib/types";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

const SNAP_SCRIPT_ID = "midtrans-snap";
const SNAP_SANDBOX = "https://app.sandbox.midtrans.com/snap/snap.js";
const SNAP_PRODUCTION = "https://app.midtrans.com/snap/snap.js";

function loadSnapScript(clientKey: string, production: boolean) {
  if (typeof window === "undefined" || window.snap) return;
  if (document.getElementById(SNAP_SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = SNAP_SCRIPT_ID;
  script.src = production ? SNAP_PRODUCTION : SNAP_SANDBOX;
  script.setAttribute("data-client-key", clientKey);
  script.async = true;
  document.body.appendChild(script);
}

const STATUS_TONE: Record<OrderStatus, "default" | "success" | "warning" | "danger" | "info" | "muted"> = {
  pending: "warning",
  paid: "info",
  shipped: "default",
  completed: "success",
  cancelled: "danger",
};

export function OrderCard({
  order,
  midtransEnabled = false,
  midtransClientKey = "",
  midtransProduction = false,
}: {
  order: Order;
  midtransEnabled?: boolean;
  midtransClientKey?: string;
  midtransProduction?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (midtransEnabled && order.status === "pending" && midtransClientKey) {
      loadSnapScript(midtransClientKey, midtransProduction);
    }
  }, [midtransEnabled, midtransClientKey, midtransProduction, order.status]);

  function payWithMidtrans() {
    startTransition(async () => {
      const res = await createSnapSession(order.id);
      if (!res.ok || !res.token) {
        toast.error(res.message);
        return;
      }

      // Fallback: bila Snap.js gagal dimuat, alihkan ke halaman pembayaran.
      if (!window.snap) {
        if (res.redirectUrl) window.location.href = res.redirectUrl;
        else toast.error("Gagal memuat halaman pembayaran Midtrans.");
        return;
      }

      window.snap.pay(res.token, {
        onSuccess: () => {
          toast.success("Pembayaran berhasil. Status pesanan diperbarui.");
          router.refresh();
        },
        onPending: () => {
          toast.info("Pembayaran menunggu penyelesaian. Selesaikan sesuai instruksi.");
          router.refresh();
        },
        onError: () => {
          toast.error("Pembayaran gagal. Silakan coba lagi.");
        },
        onClose: () => {
          toast.info("Jendela pembayaran ditutup sebelum selesai.");
        },
      });
    });
  }

  function simulate() {
    startTransition(async () => {
      const res = await simulatePayment(order.id);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      router.refresh();
    });
  }

  function cancel() {
    startTransition(async () => {
      const res = await cancelOrder(order.id);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      router.refresh();
    });
  }

  const reference = order.payment_reference?.split("|")[0] ?? "—";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border">
        <div>
          <p className="font-mono text-sm font-semibold">{reference}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(order.created_at)}
          </p>
        </div>
        <Badge tone={STATUS_TONE[order.status]}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        <div className="space-y-2">
          {(order.order_items ?? []).map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.products?.image_url && (
                  <Image
                    src={item.products.image_url}
                    alt={item.products.title ?? ""}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {item.products?.title ?? "Produk dihapus"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} × {formatIDR(item.price_at_purchase)}
                </p>
              </div>
              <span className="text-sm font-medium">
                {formatIDR(item.quantity * Number(item.price_at_purchase))}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-bold text-primary">
            {formatIDR(order.total_amount)}
          </span>
        </div>

        {order.shipping_address_json && (
          <p className="rounded-md bg-secondary/50 p-2 text-xs text-muted-foreground">
            Kirim ke: {order.shipping_address_json.recipient_name} —{" "}
            {order.shipping_address_json.street_address},{" "}
            {order.shipping_address_json.city}
          </p>
        )}

        {order.status === "pending" && (
          <div className="flex flex-col gap-2 sm:flex-row">
            {midtransEnabled ? (
              <Button className="flex-1" loading={pending} onClick={payWithMidtrans}>
                <CreditCard className="h-4 w-4" /> Bayar Sekarang
              </Button>
            ) : (
              <Button className="flex-1" loading={pending} onClick={simulate}>
                <CheckCircle2 className="h-4 w-4" /> Simulasikan Pembayaran
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
              loading={pending}
              onClick={cancel}
            >
              <XCircle className="h-4 w-4" /> Batalkan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
