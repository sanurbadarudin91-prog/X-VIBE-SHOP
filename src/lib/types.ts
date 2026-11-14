export type UserRole = "customer" | "admin";

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "completed"
  | "cancelled";

export type DiscountType = "fixed" | "percentage";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  recipient_name: string;
  phone_number: string;
  street_address: string;
  city: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  stock: number;
  category: string;
  image_url: string | null;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  products?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: OrderStatus;
  shipping_address_json: ShippingAddress | null;
  payment_reference: string | null;
  payment_provider?: string | null;
  midtrans_order_id?: string | null;
  snap_token?: string | null;
  paid_at?: string | null;
  created_at: string;
  order_items?: OrderItem[];
  profiles?: Pick<Profile, "full_name" | "phone"> | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  price_at_purchase: number;
  products?: Pick<Product, "title" | "image_url"> | null;
}

export interface Voucher {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase: number;
  expiry_date: string | null;
  is_active: boolean;
}

export interface UserVoucher {
  id: string;
  user_id: string;
  voucher_id: string;
  is_claimed: boolean;
  is_used: boolean;
  vouchers?: Voucher;
}

export interface ShippingAddress {
  recipient_name: string;
  phone_number: string;
  street_address: string;
  city: string;
  postal_code: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Menunggu Pembayaran",
  paid: "Dibayar",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "completed",
];

export const PRODUCT_CATEGORIES = ["Apparel", "Digital", "Aksesoris"] as const;
