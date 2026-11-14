"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Layers, Plus, Save, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProductImagesUploader } from "@/components/admin/product-images-uploader";
import {
  VariantColorEditor,
  type VariantColor,
} from "@/components/admin/variant-color-editor";
import {
  deleteProduct,
  saveProduct,
  type ProductInput,
} from "@/lib/actions/admin";
import { MAX_PRODUCT_IMAGES } from "@/lib/product-constants";
import { formatIDR } from "@/lib/utils";
import { PRODUCT_CATEGORIES, type Product } from "@/lib/types";

const EMPTY: ProductInput = {
  title: "",
  description: "",
  caption: "",
  price: 0,
  stock: 0,
  category: PRODUCT_CATEGORIES[0],
  image_url: "",
  images: [],
  colors: [],
  variant_stock: {},
};

/** Ubah array warna + map stok menjadi daftar varian untuk editor. */
function toVariants(p: Product): VariantColor[] {
  return (p.colors ?? []).map((name) => ({
    name,
    stock: Number(p.variant_stock?.[name] ?? 0),
  }));
}

function variantsToForm(variants: VariantColor[]) {
  const colors = variants.map((v) => v.name);
  const variant_stock: Record<string, number> = {};
  for (const v of variants) variant_stock[v.name] = Math.max(0, Math.floor(v.stock) || 0);
  return { colors, variant_stock };
}

export function ProductManager({ products }: { products: Product[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [variants, setVariants] = useState<VariantColor[]>([]);
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter((p) => {
      if (lowOnly && p.stock > 5) return false;
      if (!term) return true;
      return (
        p.title.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );
    });
  }, [products, q, lowOnly]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setVariants([]);
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      id: p.id,
      title: p.title,
      description: p.description ?? "",
      caption: p.caption ?? "",
      price: Number(p.price),
      stock: p.stock,
      category: p.category,
      image_url: p.image_url ?? "",
      images: p.images ?? (p.image_url ? [p.image_url] : []),
      colors: p.colors ?? [],
      variant_stock: p.variant_stock ?? {},
    });
    setVariants(toVariants(p));
    setOpen(true);
  }

  function submit() {
    const payload: ProductInput = { ...form, ...variantsToForm(variants) };
    startTransition(async () => {
      const res = await saveProduct(payload);
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
    if (
      !confirm(
        `Hapus produk "${p.title}"? Tindakan ini permanen dan foto produk ikut dihapus.`,
      )
    )
      return;
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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari produk atau kategori..."
            className="pl-9"
            aria-label="Cari produk"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Hanya stok menipis (≤ 5)
        </label>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Produk</th>
              <th className="p-3 font-medium">Kategori</th>
              <th className="p-3 font-medium">Harga</th>
              <th className="p-3 font-medium">Stok</th>
              <th className="p-3 font-medium">Varian</th>
              <th className="p-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Tidak ada produk yang cocok.
                </td>
              </tr>
            )}
            {filtered.map((p) => {
              const colors = p.colors ?? [];
              return (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <td className="max-w-xs p-3">
                    <div className="flex items-center gap-2">
                      {(p.images?.length ?? 0) > 0 && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images[0]}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.title}</p>
                        {(p.images?.length ?? 0) > 1 && (
                          <p className="text-xs text-muted-foreground">
                            {p.images.length} foto
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.category}</td>
                  <td className="p-3">{formatIDR(p.price)}</td>
                  <td className="p-3">
                    <span className={p.stock <= 5 ? "text-amber-500" : ""}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-3">
                    {colors.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {colors.slice(0, 3).map((c) => (
                          <Badge key={c} tone="muted">
                            {c}: {p.variant_stock?.[c] ?? 0}
                          </Badge>
                        ))}
                        {colors.length > 3 && (
                          <Badge tone="muted">+{colors.length - 3}</Badge>
                        )}
                      </div>
                    )}
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
                        aria-label={`Hapus ${p.title}`}
                        title="Hapus produk"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Produk" : "Tambah Produk"}
        className="max-w-2xl"
      >
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div>
            <Label htmlFor="title">Nama Produk</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <Label>Foto Produk (maks {MAX_PRODUCT_IMAGES})</Label>
            <ProductImagesUploader
              images={form.images}
              onChange={(images) => setForm({ ...form, images })}
            />
          </div>

          <div>
            <Label htmlFor="description">Deskripsi Singkat</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ringkasan singkat produk."
            />
          </div>

          <div>
            <Label htmlFor="caption">Caption / Detail Lengkap</Label>
            <Textarea
              id="caption"
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              placeholder={
                "Bahan & perawatan, panduan ukuran (size chart), keunggulan produk…"
              }
              className="min-h-[160px]"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Mendukung teks panjang & baris baru; tampil rapi di halaman produk.
            </p>
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
              <Label htmlFor="stock">
                Stok Umum {variants.length > 0 && "(diabaikan — pakai varian)"}
              </Label>
              <Input
                id="stock"
                type="number"
                min={0}
                value={form.stock}
                disabled={variants.length > 0}
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

          <div className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Varian Warna & Stok</span>
            </div>
            <VariantColorEditor value={variants} onChange={setVariants} />
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

