"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./cart";

export interface AddressInput {
  id?: string;
  recipient_name: string;
  phone_number: string;
  street_address: string;
  city: string;
  postal_code: string;
  is_default: boolean;
}

export async function saveAddress(input: AddressInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Silakan login terlebih dahulu." };

  const payload = {
    user_id: user.id,
    recipient_name: input.recipient_name.trim(),
    phone_number: input.phone_number.trim(),
    street_address: input.street_address.trim(),
    city: input.city.trim(),
    postal_code: input.postal_code.trim(),
    is_default: input.is_default,
  };

  if (!payload.recipient_name || !payload.phone_number || !payload.street_address)
    return { ok: false, message: "Lengkapi data alamat terlebih dahulu." };

  const { error } = input.id
    ? await supabase.from("addresses").update(payload).eq("id", input.id).eq("user_id", user.id)
    : await supabase.from("addresses").insert(payload);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/profile");
  revalidatePath("/checkout");
  return { ok: true, message: input.id ? "Alamat diperbarui." : "Alamat ditambahkan." };
}

export async function deleteAddress(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Silakan login terlebih dahulu." };

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/profile");
  revalidatePath("/checkout");
  return { ok: true, message: "Alamat dihapus." };
}

export async function setDefaultAddress(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Silakan login terlebih dahulu." };

  // Trigger DB akan mematikan default lain secara otomatis.
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/profile");
  revalidatePath("/checkout");
  return { ok: true, message: "Alamat utama diperbarui." };
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Silakan login terlebih dahulu." };

  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, phone })
    .eq("id", user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/profile");
  return { ok: true, message: "Profil diperbarui." };
}

export async function updateAvatarUrl(url: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Silakan login terlebih dahulu." };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/profile");
  return { ok: true, message: "Foto profil diperbarui." };
}
