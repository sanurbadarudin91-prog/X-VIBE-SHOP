"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { variantKey } from "@/lib/variants";

export interface VariantState {
  colors: string[];
  colorHex: Record<string, string>;
  sizes: string[];
  /** Stok per kombinasi "warna|ukuran" (lihat variantKey). */
  stock: Record<string, number>;
}

/** Preset warna + kode hex untuk mempercepat input admin. */
const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: "Hitam", hex: "#111827" },
  { name: "Putih", hex: "#f8fafc" },
  { name: "Navy", hex: "#1e3a8a" },
  { name: "Sage Green", hex: "#9ca88a" },
  { name: "Maroon", hex: "#7f1d1d" },
  { name: "Abu-abu", hex: "#9ca3af" },
  { name: "Beige", hex: "#e7d8c9" },
  { name: "Cokelat", hex: "#78350f" },
  { name: "Merah", hex: "#dc2626" },
  { name: "Biru", hex: "#2563eb" },
  { name: "Hijau", hex: "#16a34a" },
  { name: "Kuning", hex: "#eab308" },
];

const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "XXL"];

/**
 * Editor varian lengkap: warna (dengan color picker hex), ukuran, dan stok per
 * kombinasi warna × ukuran. Stok total produk dihitung otomatis di server.
 */
export function VariantEditor({
  value,
  onChange,
}: {
  value: VariantState;
  onChange: (next: VariantState) => void;
}) {
  const [colorDraft, setColorDraft] = useState("");
  const [sizeDraft, setSizeDraft] = useState("");

  const hasColor = (n: string) =>
    value.colors.some((c) => c.toLowerCase() === n.toLowerCase());
  const hasSize = (n: string) =>
    value.sizes.some((s) => s.toLowerCase() === n.toLowerCase());

  function addColor(name: string, hex?: string) {
    const n = name.trim();
    if (!n || hasColor(n)) return;
    onChange({
      ...value,
      colors: [...value.colors, n],
      colorHex: { ...value.colorHex, [n]: hex ?? "#888888" },
    });
    setColorDraft("");
  }

  function removeColor(name: string) {
    const nextStock = { ...value.stock };
    for (const s of value.sizes) delete nextStock[variantKey(name, s)];
    const nextHex = { ...value.colorHex };
    delete nextHex[name];
    onChange({
      ...value,
      colors: value.colors.filter((c) => c !== name),
      colorHex: nextHex,
      stock: nextStock,
    });
  }

  function setHex(name: string, hex: string) {
    onChange({ ...value, colorHex: { ...value.colorHex, [name]: hex } });
  }

  function addSize(name: string) {
    const n = name.trim();
    if (!n || hasSize(n)) return;
    onChange({ ...value, sizes: [...value.sizes, n] });
    setSizeDraft("");
  }

  function removeSize(name: string) {
    const nextStock = { ...value.stock };
    for (const c of value.colors) delete nextStock[variantKey(c, name)];
    onChange({
      ...value,
      sizes: value.sizes.filter((s) => s !== name),
      stock: nextStock,
    });
  }

  function setStock(color: string, size: string, qty: number) {
    onChange({
      ...value,
      stock: {
        ...value.stock,
        [variantKey(color, size)]: Math.max(0, Math.floor(qty) || 0),
      },
    });
  }

  const hasMatrix = value.colors.length > 0 && value.sizes.length > 0;
  const total = Object.values(value.stock).reduce((s, n) => s + (n || 0), 0);

  return (
    <div className="space-y-5">
      {/* Warna */}
      <div className="space-y-3">
        <Label>Warna</Label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => addColor(p.name, p.hex)}
              disabled={hasColor(p.name)}
              className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
            >
              <span
                className="h-3 w-3 rounded-full border border-border"
                style={{ backgroundColor: p.hex }}
              />
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={colorDraft}
            onChange={(e) => setColorDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addColor(colorDraft);
              }
            }}
            placeholder="Tambah warna kustom…"
          />
          <Button type="button" variant="outline" onClick={() => addColor(colorDraft)}>
            <Plus className="h-4 w-4" /> Tambah
          </Button>
        </div>

        {value.colors.length > 0 && (
          <div className="space-y-2">
            {value.colors.map((c) => (
              <div key={c} className="flex items-center gap-2">
                <input
                  type="color"
                  value={value.colorHex[c] ?? "#888888"}
                  onChange={(e) => setHex(c, e.target.value)}
                  aria-label={`Kode warna ${c}`}
                  className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-transparent"
                />
                <span className="min-w-0 flex-1 truncate rounded-md border border-border px-3 py-2 text-sm">
                  {c}
                </span>
                <Input
                  value={value.colorHex[c] ?? ""}
                  onChange={(e) => setHex(c, e.target.value)}
                  className="w-28 font-mono text-xs"
                  aria-label={`Hex warna ${c}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeColor(c)}
                  aria-label={`Hapus warna ${c}`}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ukuran */}
      <div className="space-y-3">
        <Label>Ukuran</Label>
        <div className="flex flex-wrap gap-1.5">
          {SIZE_PRESETS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addSize(s)}
              disabled={hasSize(s)}
              className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
            >
              + {s}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={sizeDraft}
            onChange={(e) => setSizeDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSize(sizeDraft);
              }
            }}
            placeholder="Tambah ukuran kustom…"
          />
          <Button type="button" variant="outline" onClick={() => addSize(sizeDraft)}>
            <Plus className="h-4 w-4" /> Tambah
          </Button>
        </div>

        {value.sizes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.sizes.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-sm"
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeSize(s)}
                  aria-label={`Hapus ukuran ${s}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Matriks stok warna × ukuran */}
      {hasMatrix && (
        <div className="space-y-2">
          <Label>Stok per Varian</Label>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 font-medium">Warna</th>
                  {value.sizes.map((s) => (
                    <th key={s} className="p-2 text-center font-medium">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {value.colors.map((c) => (
                  <tr key={c} className="border-b border-border/60 last:border-0">
                    <td className="p-2">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-border"
                          style={{ backgroundColor: value.colorHex[c] ?? "#888888" }}
                        />
                        <span className="truncate">{c}</span>
                      </span>
                    </td>
                    {value.sizes.map((s) => (
                      <td key={s} className="p-2">
                        <Input
                          type="number"
                          min={0}
                          value={value.stock[variantKey(c, s)] ?? 0}
                          onChange={(e) =>
                            setStock(c, s, Number(e.target.value))
                          }
                          className="h-9 w-20 text-center"
                          aria-label={`Stok ${c} ${s}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Total stok dari {value.colors.length * value.sizes.length} varian:{" "}
            <strong>{total}</strong> (otomatis menjadi stok produk)
          </p>
        </div>
      )}

      {value.colors.length === 0 && value.sizes.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Belum ada varian. Bila kosong, stok memakai kolom stok umum di atas.
        </p>
      )}
    </div>
  );
}
