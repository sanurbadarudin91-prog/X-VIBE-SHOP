import { createClient } from "@/lib/supabase/server";
import type {
  Address,
  CartItem,
  Order,
  Product,
  Profile,
  UserVoucher,
  Voucher,
} from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export interface ProductQuery {
  q?: string;
  category?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "title_asc";
}

export async function getProducts(params: ProductQuery = {}): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase.from("products").select("*");

  if (params.q) query = query.ilike("title", `%${params.q}%`);
  if (params.category && params.category !== "all")
    query = query.eq("category", params.category);

  switch (params.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "title_asc":
      query = query.order("title", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data } = await query;
  return (data as Product[]) ?? [];
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Product) ?? null;
}

export async function getCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("category");
  const set = new Set((data ?? []).map((r: { category: string }) => r.category));
  return Array.from(set).sort();
}

export async function getCart(): Promise<CartItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("cart_items")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  return (data as CartItem[]) ?? [];
}

export async function getCartCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("user_id", user.id);
  return (data ?? []).reduce((sum, r: { quantity: number }) => sum + r.quantity, 0);
}

export async function getAddresses(): Promise<Address[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  return (data as Address[]) ?? [];
}

export async function getActiveVouchers(): Promise<Voucher[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vouchers")
    .select("*")
    .eq("is_active", true)
    .order("min_purchase", { ascending: true });
  return (data as Voucher[]) ?? [];
}

export async function getMyVouchers(): Promise<UserVoucher[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_vouchers")
    .select("*, vouchers(*)")
    .eq("user_id", user.id);
  return (data as UserVoucher[]) ?? [];
}

export async function getMyOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*, products(title, image_url))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data as Order[]) ?? [];
}

export async function getOrder(id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*, products(title, image_url))")
    .eq("id", id)
    .maybeSingle();
  return (data as Order) ?? null;
}

export interface AdminStats {
  revenue: number;
  orderCount: number;
  pendingCount: number;
  customerCount: number;
  productCount: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();

  const [paidOrders, allOrders, pending, customers, products] = await Promise.all([
    supabase.from("orders").select("total_amount").in("status", ["paid", "shipped", "completed"]),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ]);

  const revenue = (paidOrders.data ?? []).reduce(
    (sum, r: { total_amount: number }) => sum + Number(r.total_amount),
    0,
  );

  return {
    revenue,
    orderCount: allOrders.count ?? 0,
    pendingCount: pending.count ?? 0,
    customerCount: customers.count ?? 0,
    productCount: products.count ?? 0,
  };
}

export async function getAdminVouchers(): Promise<Voucher[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vouchers")
    .select("*")
    .order("is_active", { ascending: false })
    .order("code", { ascending: true });
  return (data as Voucher[]) ?? [];
}

export async function getAdminOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(title, image_url))")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const orders = data as Order[];
  const userIds = Array.from(new Set(orders.map((o) => o.user_id)));
  if (userIds.length === 0) return orders;

  // orders.user_id mereferensikan auth.users, bukan profiles, sehingga tidak ada
  // relasi PostgREST yang bisa di-embed. Ambil profil terpisah lalu digabung.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .in("id", userIds);

  const byId = new Map(
    (profiles ?? []).map((p: { id: string; full_name: string | null; phone: string | null }) => [
      p.id,
      { full_name: p.full_name, phone: p.phone },
    ]),
  );

  return orders.map((o) => ({ ...o, profiles: byId.get(o.user_id) ?? null }));
}
