# X-VIBE-SHOP

Marketplace e-commerce full-stack (apparel, produk digital, aksesoris) bergaya
cyberpunk. Dibangun dengan **Next.js 15 (App Router)** + **Supabase**
(Postgres, Auth, Storage, RLS).

## Fitur

**Toko (customer)**
- Autentikasi: email/password + OAuth **Google** & **Facebook** (Supabase Auth)
- Homepage, katalog produk, filter kategori, pencarian, dan pengurutan
- Detail produk + galeri gambar
- Keranjang belanja (drawer + halaman `/cart`, sinkron ke database)
- Klaim & penerapan **voucher** (diskon fixed/percentage, minimum belanja)
- Checkout: pilih alamat, metode bayar (Transfer Bank VA / QRIS / e-wallet),
  pembuatan pesanan + referensi pembayaran
- Riwayat pesanan + pembayaran online (Midtrans Snap) + pembatalan
- Profil: ubah data diri, upload avatar, dan kelola multi-alamat (satu default)

**Admin (`/admin`)**
- Ringkasan: pendapatan, jumlah pesanan, pelanggan, produk
- CRUD produk
- Kelola pesanan + ubah status (pending → paid → shipped → completed / cancelled)
- CRUD voucher

## Arsitektur

```
src/
  app/
    (shop)/            # route group toko: /, /products, /cart, /checkout,
                       #   /orders, /vouchers, /profile, /login
    admin/             # dashboard admin (dilindungi peran admin)
    api/payment/midtrans/webhook/  # webhook notifikasi Midtrans
    auth/callback/     # callback OAuth
  components/          # UI (shadcn-style) + fitur per-domain
  lib/
    supabase/          # client (browser), server, admin, middleware
    payments/          # helper server-side Midtrans (Snap + signature)
    actions/           # Next.js Server Actions (cart, orders, addresses, admin, vouchers)
    queries.ts         # pembacaan data (server-side)
    types.ts           # tipe domain
    vouchers.ts        # logika perhitungan diskon
supabase/
  schema.sql           # DDL: tabel, RLS, trigger, fungsi RPC
  seed.sql             # data contoh (10 produk, 4 voucher)
```

### Skema database

| Tabel | Keterangan |
| --- | --- |
| `profiles` | Profil publik user (1-1 dengan `auth.users`), termasuk `role` |
| `addresses` | Multi-alamat per user, satu ditandai default |
| `products` | Katalog produk |
| `cart_items` | Item keranjang (unik per user+produk) |
| `orders` | Pesanan + snapshot alamat + referensi pembayaran |
| `order_items` | Item pesanan (`price_at_purchase`) |
| `vouchers` | Definisi voucher |
| `user_vouchers` | Voucher yang diklaim user |

**Row Level Security** aktif di semua tabel. Pelanggan hanya dapat mengakses
datanya sendiri; produk & voucher dapat dibaca publik dan hanya ditulis admin.
Aksi istimewa (mis. mengurangi/mengembalikan stok, menandai pesanan lunas)
dijalankan melalui fungsi Postgres `security definer` agar tetap aman:
`pay_order`, `cancel_order`, `decrement_stock_for_order`, `restore_stock_for_order`.

## Menjalankan secara lokal

1. **Siapkan environment**

   ```bash
   cp .env.example .env.local
   # isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
   # dan SUPABASE_SECRET_KEY dengan nilai project Supabase Anda
   ```

2. **Inisialisasi database**

   Jalankan `supabase/schema.sql` lalu `supabase/seed.sql` pada SQL Editor
   Supabase, atau via `psql`:

   ```bash
   psql "<connection-string>" -f supabase/schema.sql
   psql "<connection-string>" -f supabase/seed.sql
   ```

3. **Aktifkan OAuth** (opsional) di Supabase → Authentication → Providers
   untuk Google dan Facebook, lalu tambahkan
   `http://localhost:3000/auth/callback` sebagai redirect URL.

4. **Jalankan aplikasi**

   ```bash
   npm install
   npm run dev
   ```

   Buka <http://localhost:3000>.

## Skrip

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Build produksi |
| `npm start` | Jalankan hasil build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify:midtrans` | Uji signature & pemetaan status Midtrans |

## Pembayaran (Midtrans Snap)

Tombol **Bayar Sekarang** pada kartu pesanan memanggil Server Action
`createSnapSession`, yang membuat transaksi Snap di server
(`src/lib/payments/midtrans.ts`) dan menyimpan token ke `orders`. Popup Snap
dibuka di browser memakai client key publik.

Status pesanan diperbarui oleh webhook
`src/app/api/payment/midtrans/webhook/route.ts`, yang:

1. memverifikasi signature `sha512(order_id + status_code + gross_amount +
   serverKey)`,
2. mencocokkan nominal notifikasi dengan `orders.total_amount`,
3. memanggil RPC `service_role` `mark_order_paid_from_gateway` /
   `mark_order_cancelled_from_gateway` (idempotent).

Set env `MIDTRANS_SERVER_KEY`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, dan
`MIDTRANS_IS_PRODUCTION` (lihat [`DEPLOY.md`](./DEPLOY.md)), lalu daftarkan URL
webhook di dashboard Midtrans.

## Keamanan

- `.env.local` tidak ikut di-commit (lihat `.gitignore`); jangan pernah
  menaruh service-role key di kode client.
- Semua penulisan data sensitif divalidasi di sisi server dan dilindungi RLS.

## Deploy

- **Live (produksi)**: <https://x-vibe-shop.vercel.app>
- Panduan lengkap: [`DEPLOY.md`](./DEPLOY.md) (environment variables,
  konfigurasi auth Supabase, domain, dan verifikasi).
- Verifikasi rute setelah deploy: `npm run check:deploy https://<domain>`.
