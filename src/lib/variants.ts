

/** Kunci kanonik kombinasi varian; harus sama dengan public.variant_key di SQL. */
export function variantKey(color?: string | null, size?: string | null) {
  return `${(color ?? "").trim()}|${(size ?? "").trim()}`;
}

export interface VariantSource {
  stock: number;
  variant_stock?: Record<string, number> | null;
}

/**
 * Stok tersedia untuk sebuah kombinasi varian pada sisi klien.
 * Urutan pencarian: kunci gabungan -> warna saja -> ukuran saja -> stok total.
 * Cerminan dari public.variant_available di database.
 */
export function variantStock(
  product: VariantSource,
  color?: string | null,
  size?: string | null,
): number {
  const map = product.variant_stock ?? {};
  const c = color?.trim() || null;
  const s = size?.trim() || null;

  const combined = map[variantKey(c, s)];
  if (combined != null) return Number(combined) || 0;

  if (c && map[c] != null) return Number(map[c]) || 0;
  if (s && map[s] != null) return Number(map[s]) || 0;

  return Number(product.stock) || 0;
}

/** Label varian ringkas untuk keranjang/pesanan, mis. "Hitam · M". */
export function variantLabel(
  color?: string | null,
  size?: string | null,
): string | null {
  const parts = [color?.trim(), size?.trim()].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/** Warna swatch dengan fallback nama warna CSS agar tetap terlihat. */
export function colorSwatch(
  color: string,
  hex?: Record<string, string> | null,
): string {
  return hex?.[color] || color;
}
