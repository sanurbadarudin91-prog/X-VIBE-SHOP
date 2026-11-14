"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface VariantColor {
  name: string;
  stock: number;
}

/** Preset warna umum untuk mempercepat input. */
const PRESETS = [
  "Hitam",
  "Putih",
  "Navy",
  "Sage Green",
  "Maroon",
  "Abu-abu",
  "Beige",
  "Cokelat",
  "Merah",
  "Biru",
  "Hijau",
  "Kuning",
];

/**
 * Editor varian warna: tag selector + input stok per warna.
 * Stok total produk dihitung otomatis dari jumlah stok tiap warna.
 */
export function VariantColorEditor({
  value,
  onChange,
}: {
  value: VariantColor[];
  onChange: (next: VariantColor[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const has = (name: string) =>
    value.some((v) => v.name.toLowerCase() === name.toLowerCase());

  function add(name: string) {
    const n = name.trim();
    if (!n) return;
    if (has(n)) {
      setDraft("");
      return;
    }
    onChange([...value, { name: n, stock: 0 }]);
    setDraft("");
  }

  function remove(name: string) {
    onChange(value.filter((v) => v.name !== name));
  }

  function setStock(name: string, stock: number) {
    onChange(
      value.map((v) => (v.name === name ? { ...v, stock: Math.max(0, stock || 0) } : v)),
    );
  }

  const total = value.reduce((sum, v) => sum + (v.stock || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => add(p)}
            disabled={has(p)}
            className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
          >
            + {p}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder="Tambah warna kustom…"
        />
        <Button type="button" variant="outline" onClick={() => add(draft)}>
          <Plus className="h-4 w-4" /> Tambah
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Belum ada varian warna. Bila kosong, stok memakai kolom stok umum di atas.
        </p>
      ) : (
        <div className="space-y-2">
          {value.map((v) => (
            <div key={v.name} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate rounded-md border border-border px-3 py-2 text-sm">
                {v.name}
              </span>
              <Input
                type="number"
                min={0}
                value={v.stock}
                onChange={(e) => setStock(v.name, Number(e.target.value))}
                className="w-28"
                aria-label={`Stok warna ${v.name}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(v.name)}
                aria-label={`Hapus warna ${v.name}`}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Total stok dari {value.length} varian: <strong>{total}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
