"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateOrderStatus } from "@/lib/actions/orders";
import { formatDate, formatIDR } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "completed",
  "cancelled",
];

const TONE: Record<
  OrderStatus,
  "default" | "success" | "warning" | "danger" | "info" | "muted"
> = {
  pending: "warning",
  paid: "info",
  shipped: "default",
  completed: "success",
  cancelled: "danger",
};

function OrderRow({ order }: { order: Order }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(status: OrderStatus) {
    startTransition(async () => {
      const res = await updateOrderStatus(order.id, status);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      router.refresh();
    });
  }

  const reference = order.payment_reference?.split("|")[0] ?? order.id.slice(0, 8);
  const customer = order.profiles?.full_name ?? "Pelanggan";

  return (
    <tr className="border-b border-border/60 align-top last:border-0">
      <td className="p-3">
        <p className="font-mono text-xs font-semibold">{reference}</p>
        <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
      </td>
      <td className="p-3">
        <p className="font-medium">{customer}</p>
        {order.shipping_address_json && (
          <p className="max-w-[16rem] text-xs text-muted-foreground">
            {order.shipping_address_json.street_address},{" "}
            {order.shipping_address_json.city}
          </p>
        )}
      </td>
      <td className="p-3">
        <ul className="space-y-0.5 text-xs text-muted-foreground">
          {(order.order_items ?? []).map((it) => (
            <li key={it.id}>
              {it.quantity}× {it.products?.title ?? "Produk"}
            </li>
          ))}
        </ul>
      </td>
      <td className="p-3 font-medium">{formatIDR(order.total_amount)}</td>
      <td className="p-3">
        <Badge tone={TONE[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
      </td>
      <td className="p-3">
        <Select
          value={order.status}
          disabled={pending}
          onChange={(e) => change(e.target.value as OrderStatus)}
          aria-label="Ubah status pesanan"
          className="h-9 w-40"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </td>
    </tr>
  );
}

export function OrderTable({ orders }: { orders: Order[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!term) return true;
      const ref = (o.payment_reference ?? "").toLowerCase();
      const name = (o.profiles?.full_name ?? "").toLowerCase();
      const items = (o.order_items ?? [])
        .map((it) => it.products?.title ?? "")
        .join(" ")
        .toLowerCase();
      return (
        ref.includes(term) || name.includes(term) || items.includes(term) ||
        o.id.toLowerCase().includes(term)
      );
    });
  }, [orders, q, status]);

  if (orders.length === 0) {
    return (
      <Card className="p-10 text-center text-muted-foreground">
        Belum ada pesanan masuk.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari referensi, pelanggan, atau produk..."
            className="pl-9"
            aria-label="Cari pesanan"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}
          aria-label="Filter status"
          className="sm:w-56"
        >
          <option value="all">Semua status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          Tidak ada pesanan yang cocok dengan filter.
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Referensi</th>
                <th className="p-3 font-medium">Pelanggan</th>
                <th className="p-3 font-medium">Item</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Ubah Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <p className="text-xs text-muted-foreground">
        Menampilkan {filtered.length} dari {orders.length} pesanan.
      </p>
    </div>
  );
}
