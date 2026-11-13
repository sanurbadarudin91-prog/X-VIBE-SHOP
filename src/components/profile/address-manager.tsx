"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  deleteAddress,
  saveAddress,
  setDefaultAddress,
  type AddressInput,
} from "@/lib/actions/addresses";
import type { Address } from "@/lib/types";

const EMPTY: AddressInput = {
  recipient_name: "",
  phone_number: "",
  street_address: "",
  city: "",
  postal_code: "",
  is_default: false,
};

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, is_default: addresses.length === 0 });
    setOpen(true);
  }

  function openEdit(a: Address) {
    setEditing(a);
    setForm({
      id: a.id,
      recipient_name: a.recipient_name,
      phone_number: a.phone_number,
      street_address: a.street_address,
      city: a.city,
      postal_code: a.postal_code,
      is_default: a.is_default,
    });
    setOpen(true);
  }

  function submit() {
    startTransition(async () => {
      const res = await saveAddress(form);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      setOpen(false);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteAddress(id);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      router.refresh();
    });
  }

  function makeDefault(id: string) {
    startTransition(async () => {
      const res = await setDefaultAddress(id);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <MapPin className="h-5 w-5 text-primary" /> Alamat Pengiriman
        </h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tambah Alamat
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Belum ada alamat. Tambahkan alamat pertama Anda.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{a.recipient_name}</p>
                  <p className="text-sm text-muted-foreground">{a.phone_number}</p>
                </div>
                {a.is_default && <Badge tone="default">Utama</Badge>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {a.street_address}, {a.city} {a.postal_code}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {!a.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => makeDefault(a.id)}
                    disabled={pending}
                  >
                    <Star className="h-3.5 w-3.5" /> Jadikan Utama
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => openEdit(a)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => remove(a.id)}
                  disabled={pending}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Alamat" : "Tambah Alamat Baru"}
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="recipient_name">Nama Penerima</Label>
            <Input
              id="recipient_name"
              value={form.recipient_name}
              onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
              placeholder="Nama lengkap penerima"
            />
          </div>
          <div>
            <Label htmlFor="phone_number">Nomor Telepon</Label>
            <Input
              id="phone_number"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <div>
            <Label htmlFor="street_address">Alamat Lengkap</Label>
            <Input
              id="street_address"
              value={form.street_address}
              onChange={(e) => setForm({ ...form, street_address: e.target.value })}
              placeholder="Jalan, nomor rumah, RT/RW"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="city">Kota</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Kota"
              />
            </div>
            <div>
              <Label htmlFor="postal_code">Kode Pos</Label>
              <Input
                id="postal_code"
                value={form.postal_code}
                onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                placeholder="12345"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 pt-1 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
            />
            Jadikan alamat utama
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={submit} loading={pending}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
