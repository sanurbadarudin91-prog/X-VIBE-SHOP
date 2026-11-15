import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Address,
  CartItem,
  Order,
  OrderStatus,
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
  averageOrderValue: number;
  statusCounts: Record<OrderStatus, number>;
}

const REVENUE_STATUSES: OrderStatus[] = ["paid", "shipped", "completed"];

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();

  const [orders, customers, products] = await Promise.all([
    supabase.from("orders").select("status, total_amount"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ]);

  const rows = (orders.data ?? []) as { status: OrderStatus; total_amount: number }[];

  const statusCounts: Record<OrderStatus, number> = {
    pending: 0,
    paid: 0,
    shipped: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const r of rows) statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;

  const revenue = rows
    .filter((r) => REVENUE_STATUSES.includes(r.status))
    .reduce((sum, r) => sum + Number(r.total_amount), 0);
  const paidOrderCount = REVENUE_STATUSES.reduce((sum, s) => sum + statusCounts[s], 0);

  return {
    revenue,
    orderCount: rows.length,
    pendingCount: statusCounts.pending,
    customerCount: customers.count ?? 0,
    productCount: products.count ?? 0,
    averageOrderValue: paidOrderCount ? revenue / paidOrderCount : 0,
    statusCounts,
  };
}

export interface RevenuePoint {
  date: string;
  label: string;
  total: number;
}

/** Total pendapatan harian (pesanan lunas/dikirim/selesai) untuk `days` hari terakhir. */
export async function getRevenueSeries(days = 7): Promise<RevenuePoint[]> {
  const supabase = await createClient();

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const { data } = await supabase
    .from("orders")
    .select("total_amount, created_at")
    .in("status", REVENUE_STATUSES)
    .gte("created_at", start.toISOString());

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const r of (data ?? []) as { total_amount: number; created_at: string }[]) {
    const key = new Date(r.created_at).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(r.total_amount));
  }

  return Array.from(buckets.entries()).map(([date, total]) => ({
    date,
    label: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(new Date(date)),
    total,
  }));
}

export async function getLowStockProducts(threshold = 5): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .lte("stock", threshold)
    .order("stock", { ascending: true })
    .limit(10);
  return (data as Product[]) ?? [];
}

export interface AdminCustomer {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export async function getAdminCustomers(): Promise<AdminCustomer[]> {
  const supabase = await createClient();

  const [profilesRes, ordersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone, created_at")
      .eq("role", "customer")
      .order("created_at", { ascending: false }),
    supabase.from("orders").select("user_id, total_amount, status, created_at"),
  ]);

  // Email hanya ada di auth.users; ambil lewat service_role bila tersedia.
  const emailById = new Map<string, string>();
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of data?.users ?? []) {
      if (u.email) emailById.set(u.id, u.email);
    }
  } catch {
    // Diamkan: email bersifat pelengkap.
  }

  const stats = new Map<string, { count: number; spent: number; last: string | null }>();
  for (const o of (ordersRes.data ?? []) as {
    user_id: string;
    total_amount: number;
    status: OrderStatus;
    created_at: string;
  }[]) {
    const cur = stats.get(o.user_id) ?? { count: 0, spent: 0, last: null };
    cur.count += 1;
    if (REVENUE_STATUSES.includes(o.status)) cur.spent += Number(o.total_amount);
    if (!cur.last || o.created_at > cur.last) cur.last = o.created_at;
    stats.set(o.user_id, cur);
  }

  return ((profilesRes.data ?? []) as {
    id: string;
    full_name: string | null;
    phone: string | null;
    created_at: string;
  }[]).map((p) => {
    const s = stats.get(p.id);
    return {
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      email: emailById.get(p.id) ?? null,
      created_at: p.created_at,
      orderCount: s?.count ?? 0,
      totalSpent: s?.spent ?? 0,
      lastOrderAt: s?.last ?? null,
    };
  });
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
