"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { MAX_PRODUCT_IMAGES, MAX_PRODUCT_IMAGE_MB } from "@/lib/product-constants";
import { cn } from "@/lib/utils";

/** Upload multi-foto produk ke Supabase Storage (bucket product-images). */
export function ProductImagesUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (next: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remaining = MAX_PRODUCT_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Maksimal ${MAX_PRODUCT_IMAGES} foto.`);
      return;
    }

    const picked = Array.from(files).slice(0, remaining);
    if (files.length > remaining)
      toast.warning(`Hanya ${remaining} foto ditambahkan (batas ${MAX_PRODUCT_IMAGES}).`);

    setUploading(true);
    const supabase = createClient();
    const uploaded: string[] = [];

    for (const file of picked) {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" bukan gambar.`);
        continue;
      }
      if (file.size > MAX_PRODUCT_IMAGE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" melebihi ${MAX_PRODUCT_IMAGE_MB}MB.`);
        continue;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `products/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) {
        toast.error(`Gagal mengunggah ${file.name}: ${error.message}`);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(path);
      uploaded.push(publicUrl);
    }

    if (uploaded.length) {
      onChange([...images, ...uploaded]);
      toast.success(`${uploaded.length} foto diunggah.`);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(i: number) {
    onChange(images.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="group relative h-20 w-20 overflow-hidden rounded-md border border-border bg-muted"
          >
            <Image src={src} alt={`Foto ${i + 1}`} fill sizes="80px" className="object-cover" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                Utama
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Hapus foto ${i + 1}`}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="absolute inset-x-0 bottom-0 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Geser kiri"
                className="bg-black/60 px-1.5 text-xs text-white disabled:opacity-30"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === images.length - 1}
                aria-label="Geser kanan"
                className="bg-black/60 px-1.5 text-xs text-white disabled:opacity-30"
              >
                ›
              </button>
            </div>
          </div>
        ))}

        {images.length < MAX_PRODUCT_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "grid h-20 w-20 place-items-center rounded-md border border-dashed border-border",
              "text-muted-foreground transition-colors hover:border-primary hover:text-primary",
              "disabled:opacity-50",
            )}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <p className="text-xs text-muted-foreground">
        {images.length}/{MAX_PRODUCT_IMAGES} foto · maks {MAX_PRODUCT_IMAGE_MB}MB/foto · foto pertama jadi
        gambar utama.
      </p>
      {uploading && (
        <p className="text-xs text-muted-foreground">Mengunggah…</p>
      )}
      {images.length > 0 && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
          Hapus semua foto
        </Button>
      )}
    </div>
  );
}
