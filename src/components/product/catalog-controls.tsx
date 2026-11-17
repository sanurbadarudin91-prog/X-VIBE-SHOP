"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "newest", label: "Terbaru" },
  { value: "price_asc", label: "Harga Terendah" },
  { value: "price_desc", label: "Harga Tertinggi" },
  { value: "title_asc", label: "Nama A–Z" },
];

export function CatalogControls({ categories }: { categories: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Nilai aktif dipakai optimistis agar chip langsung terasa responsif,
  // lalu disinkronkan kembali dengan URL begitu navigasi selesai.
  const urlCategory = searchParams.get("category") ?? "all";
  const urlSort = searchParams.get("sort") ?? "newest";
  const [activeCategory, setActiveCategory] = useState(urlCategory);
  const [activeSort, setActiveSort] = useState(urlSort);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    setActiveCategory(urlCategory);
    setActiveSort(urlSort);
  }, [urlCategory, urlSort]);

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    // Navigasi client-side tanpa reload penuh; scroll dipertahankan agar
    // pengguna tidak "terlempar" ke atas setiap ganti kategori.
    startTransition(() => {
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    });
  }

  function selectCategory(c: string) {
    setActiveCategory(c);
    update("category", c);
  }

  function selectSort(value: string) {
    setActiveSort(value);
    update("sort", value);
  }

  const allCategories = ["all", ...categories];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {allCategories.map((c) => (
          <button key={c} onClick={() => selectCategory(c)} aria-pressed={activeCategory === c}>
            <Badge
              tone={activeCategory === c ? "default" : "muted"}
              className={cn("cursor-pointer transition-colors hover:border-primary/50", activeCategory === c && "cyber-glow")}
            >
              {c === "all" ? "Semua" : c}
            </Badge>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Memuat" />
        ) : (
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        )}
        <Select
          value={activeSort}
          onChange={(e) => selectSort(e.target.value)}
          aria-label="Urutkan produk"
          className="w-44"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
