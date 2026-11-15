"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
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

  const activeCategory = searchParams.get("category") ?? "all";
  const activeSort = searchParams.get("sort") ?? "newest";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const allCategories = ["all", ...categories];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {allCategories.map((c) => (
          <button key={c} onClick={() => update("category", c)} aria-pressed={activeCategory === c}>
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
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <Select
          value={activeSort}
          onChange={(e) => update("sort", e.target.value)}
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
