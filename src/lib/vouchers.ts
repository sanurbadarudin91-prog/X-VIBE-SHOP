import type { Voucher } from "@/lib/types";

/**
 * Menghitung potongan harga dari voucher terhadap subtotal.
 * Mengembalikan nilai potongan (tidak pernah melebihi subtotal).
 */
export function computeDiscount(subtotal: number, voucher: Voucher | null): number {
  if (!voucher) return 0;
  if (subtotal < Number(voucher.min_purchase)) return 0;

  const value = Number(voucher.discount_value);
  const discount =
    voucher.discount_type === "percentage" ? (subtotal * value) / 100 : value;

  return Math.min(Math.round(discount), subtotal);
}

export function isVoucherUsable(voucher: Voucher, subtotal: number): boolean {
  if (!voucher.is_active) return false;
  if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date())
    return false;
  return subtotal >= Number(voucher.min_purchase);
}

export function voucherLabel(voucher: Voucher): string {
  return voucher.discount_type === "percentage"
    ? `${Number(voucher.discount_value)}%`
    : `Rp${Number(voucher.discount_value).toLocaleString("id-ID")}`;
}
