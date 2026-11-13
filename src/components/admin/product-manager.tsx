"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteProduct, saveProduct, type ProductInput } from "@/lib/actions/admin";
import { formatIDR } from "@/lib/utils";
import { PRODUCT_CATEGORIES, type Product } from "@/lib/types";

const EMPTY: ProductInput = {
  title: "",
  description: "",
  price: 0,
  stock: 0,
  category: PRODUCT_CATEGORIES[0],
  image_url: "",
};

export function ProductManager({ products }: { products: Product[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      id: p.id,
      title: p.title,
      description: p.description ?? "",
      price: Number(p.price),
      stock: p.stock,
      category: p.category,
      image_url: p.image_url ?? "",
    });
    setOpen(true);
  }

  function submit() {
    startTransition(async () => {
      const res = await saveProduct(form);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      setOpen(false);
      router.refresh();
    });
  }

  function remove(p: Product) {
    if (!confirm(`Hapus produk "${p.title}"?`)) return;
    startTransition(async () => {
      const res = await deleteProduct(p.id);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Produk</h1>
          <p className="text-sm text-muted-foreground">{products.length} produk</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tambah Produk
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Produk</th>
              <th className="p-3 font-medium">Kategori</th>
              <th className="p-3 font-medium">Harga</th>
              <th className="p-3 font-medium">Stok</th>
              <th className="p-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border/60 last:border-0">
                <td className="max-w-xs p-3">
                  <p className="truncate font-medium">{p.title}</p>
                </td>
                <td className="p-3 text-muted-foreground">{p.category}</td>
                <td className="p-3">{formatIDR(p.price)}</td>
                <td className="p-3">
                  <span className={p.stock <= 5 ? "text-amber-500" : ""}>
                    {p.stock}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(p)}
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
        title={editing ? "Edit Produk" : "Tambah Produk"}
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="title">Nama Produk</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">Harga (Rp)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="stock">Stok</Label>
              <Input
                id="stock"
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="category">Kategori</Label>
            <Select
              id="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="image_url">URL Gambar</Label>
            <Input
              id="image_url"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

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
