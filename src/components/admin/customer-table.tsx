"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate, formatIDR } from "@/lib/utils";
import type { AdminCustomer } from "@/lib/queries";

export function CustomerTable({ customers }: { customers: AdminCustomer[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((c) =>
      [c.full_name, c.email, c.phone]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term)),
    );
  }, [customers, q]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama, email, atau telepon..."
          className="pl-9"
          aria-label="Cari pelanggan"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          {customers.length === 0
            ? "Belum ada pelanggan terdaftar."
            : "Tidak ada pelanggan yang cocok dengan pencarian."}
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Pelanggan</th>
                <th className="p-3 font-medium">Kontak</th>
                <th className="p-3 font-medium">Pesanan</th>
                <th className="p-3 font-medium">Total Belanja</th>
                <th className="p-3 font-medium">Terakhir Pesan</th>
                <th className="p-3 font-medium">Bergabung</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{c.full_name ?? "Tanpa nama"}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    <p>{c.email ?? "—"}</p>
                    {c.phone && <p className="text-xs">{c.phone}</p>}
                  </td>
                  <td className="p-3">{c.orderCount}</td>
                  <td className="p-3 font-medium">{formatIDR(c.totalSpent)}</td>
                  <td className="p-3 text-muted-foreground">
                    {c.lastOrderAt ? formatDate(c.lastOrderAt) : "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {formatDate(c.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
