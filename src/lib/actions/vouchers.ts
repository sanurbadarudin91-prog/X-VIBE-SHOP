"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./cart";

export async function claimVoucher(voucherId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Silakan login untuk mengklaim voucher." };

  const { data: voucher } = await supabase
    .from("vouchers")
    .select("id, is_active, expiry_date")
    .eq("id", voucherId)
    .single();

  if (!voucher || !voucher.is_active)
    return { ok: false, message: "Voucher tidak tersedia." };
  if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date())
    return { ok: false, message: "Voucher sudah kedaluwarsa." };

  const { error } = await supabase
    .from("user_vouchers")
    .upsert(
      { user_id: user.id, voucher_id: voucherId, is_claimed: true },
      { onConflict: "user_id,voucher_id" },
    );

  if (error) return { ok: false, message: error.message };

  revalidatePath("/vouchers");
  revalidatePath("/checkout");
  return { ok: true, message: "Voucher berhasil diklaim." };
}

