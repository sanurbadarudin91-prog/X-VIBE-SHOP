"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useOptionalI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useOptionalI18n();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const skip = useRef(true);

  // Sinkron bila query URL berubah dari luar (mis. tombol back).
  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  // Pencarian real-time dengan debounce. Tidak menggiring pengguna ke /products
  // saat halaman lain hanya menampilkan search bar tanpa input.
  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    const current = searchParams.get("q") ?? "";
    if (value === current) return;
    if (!value && pathname !== "/products") return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("q", value);
      else params.delete("q");
      const query = params.toString();
      router.replace(`/products${query ? `?${query}` : ""}`);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("nav.search")}
        aria-label={t("common.search")}
        className="rounded-full pl-9"
      />
    </div>
  );
}
