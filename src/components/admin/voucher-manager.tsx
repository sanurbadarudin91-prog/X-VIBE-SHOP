"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  deleteVoucher,
  saveVoucher,
  type VoucherInput,
} from "@/lib/actions/admin";
import { formatDate, formatIDR } from "@/lib/utils";
import type { DiscountType, Voucher } from "@/lib/types";

const EMPTY: VoucherInput = {
  code: "",
  discount_type: "percentage",
  discount_value: 0,
  min_purchase: 0,
  expiry_date: null,
  is_active: true,
};

export function VoucherManager({ vouchers }: { vouchers: Voucher[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [form, setForm] = useState<VoucherInput>(EMPTY);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(v: Voucher) {
    setEditing(v);
    setForm({
      id: v.id,
      code: v.code,
      discount_type: v.discount_type,
      discount_value: Number(v.discount_value),
      min_purchase: Number(v.min_purchase),
      expiry_date: v.expiry_date ? v.expiry_date.slice(0, 10) : null,
      is_active: v.is_active,
    });
    setOpen(true);
  }

  function submit() {
    startTransition(async () => {
      const payload: VoucherInput = {
        ...form,
        expiry_date: form.expiry_date
          ? new Date(`${form.expiry_date}T23:59:59`).toISOString()
          : null,
      };
      const res = await saveVoucher(payload);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      setOpen(false);
      router.refresh();
    });
  }

  function remove(v: Voucher) {
    if (!confirm(`Hapus voucher "${v.code}"?`)) return;
    startTransition(async () => {
      const res = await deleteVoucher(v.id);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Voucher</h1>
          <p className="text-sm text-muted-foreground">{vouchers.length} voucher</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Buat Voucher
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Kode</th>
              <th className="p-3 font-medium">Diskon</th>
              <th className="p-3 font-medium">Min. Belanja</th>
              <th className="p-3 font-medium">Berlaku Hingga</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id} className="border-b border-border/60 last:border-0">
                <td className="p-3 font-mono font-semibold">{v.code}</td>
                <td className="p-3">
                  {v.discount_type === "percentage"
                    ? `${Number(v.discount_value)}%`
                    : formatIDR(v.discount_value)}
                </td>
                <td className="p-3">{formatIDR(v.min_purchase)}</td>
                <td className="p-3 text-muted-foreground">
                  {v.expiry_date ? formatDate(v.expiry_date) : "—"}
                </td>
                <td className="p-3">
                  {v.is_active ? (
                    <Badge tone="success">Aktif</Badge>
                  ) : (
                    <Badge tone="muted">Nonaktif</Badge>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => openEdit(v)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(v)}
                      disabled={pending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Voucher" : "Buat Voucher"}
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="code">Kode Voucher</Label>
            <Input
              id="code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="VIBENEW10"
              className="font-mono uppercase"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="discount_type">Tipe Diskon</Label>
              <Select
                id="discount_type"
                value={form.discount_type}
                onChange={(e) =>
                  setForm({ ...form, discount_type: e.target.value as DiscountType })
                }
              >
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal (Rp)</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="discount_value">
                Nilai {form.discount_type === "percentage" ? "(%)" : "(Rp)"}
              </Label>
              <Input
                id="discount_value"
                type="number"
                min={0}
                value={form.discount_value}
                onChange={(e) =>
                  setForm({ ...form, discount_value: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="min_purchase">Min. Belanja (Rp)</Label>
              <Input
                id="min_purchase"
                type="number"
                min={0}
                value={form.min_purchase}
                onChange={(e) =>
                  setForm({ ...form, min_purchase: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label htmlFor="expiry_date">Masa Berlaku</Label>
              <Input
                id="expiry_date"
                type="date"
                value={form.expiry_date ?? ""}
                onChange={(e) =>
                  setForm({ ...form, expiry_date: e.target.value || null })
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-2 pt-1 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Aktifkan voucher
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={submit} loading={pending}>
              <Save className="h-4 w-4" /> Simpan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
