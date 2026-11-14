# AGENTS.md — X-VIBE-SHOP

Panduan singkat untuk agen yang bekerja di repo ini.

## Perintah

```bash
npm install
npm run dev        # dev server (http://localhost:3000)
npm run build      # build produksi
npm run lint       # ESLint (next lint)
npm run typecheck  # tsc --noEmit
npm run check:deploy [url]  # verifikasi rute setelah deploy
```

## Deploy

Konfigurasi Vercel ada di `vercel.json`; panduan lengkap di `DEPLOY.md`.
Region produksi: `sin1` (Singapura) agar dekat Supabase `ap-southeast-2`.

## Struktur

- `src/app/(shop)/` — halaman toko; `src/app/admin/` — dashboard admin.
- `src/lib/actions/` — Next.js Server Actions (mutasi data).
- `src/lib/queries.ts` — pembacaan data server-side.
- `src/lib/supabase/` — client (browser/server/admin) + middleware.
- `supabase/schema.sql` — DDL + RLS + trigger + fungsi RPC (idempoten).
- `supabase/seed.sql` — data contoh (idempoten).

## Konvensi penting

- **Semua mutasi data lewat Server Action atau RPC**, bukan langsung dari client.
- Operasi lintas-tabel yang harus konsisten dijalankan sebagai fungsi Postgres
  `security definer` di `schema.sql` (contoh: `create_order`, `pay_order`,
  `cancel_order`). Ini menghindari penulisan parsial dan aman terhadap RLS.
- RLS aktif di semua tabel. `orders`/`products` **tidak** dapat ditulis langsung
  oleh customer — pakai RPC.
- `orders.user_id` mengarah ke `auth.users` (bukan `profiles`), sehingga tidak
  ada relasi PostgREST `profiles` yang bisa di-embed; ambil profil terpisah lalu
  gabungkan (lihat `getAdminOrders`).
- Setelah mengubah `schema.sql`, terapkan perubahan ke DB dan uji ulang.
- Jangan commit `.env.local`; `.env.example` hanya berisi placeholder.

## Alur pesanan

`pending → paid → shipped → completed`, dengan `cancelled` sebagai cabang.
Transisi divalidasi di `ADMIN_TRANSITIONS` (`src/lib/actions/orders.ts`).

## Pembayaran (Midtrans)

- Helper server-side: `src/lib/payments/midtrans.ts` (Snap, signature sha512,
  pemetaan status). Env: `MIDTRANS_SERVER_KEY`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`,
  `MIDTRANS_IS_PRODUCTION`.
- Server Action `createSnapSession` (di `src/lib/actions/orders.ts`) membuat
  transaksi Snap dan menyimpan token via RPC `set_order_payment_token`.
- Webhook: `src/app/api/payment/midtrans/webhook/route.ts` — verifikasi
  signature + nominal, lalu panggil RPC service_role.
- `order_id` Midtrans berformat `XV-<uuid pesanan>`; webhook mengembalikan
  prefix sebelum mencari pesanan.
- Stok diubah lewat helper internal `apply_stock_delta` (tanpa cek `auth.uid()`)
  karena webhook tidak punya sesi pengguna. `apply_stock_delta` sengaja
  **tidak** di-grant ke anon/authenticated.
- Uji cepat: `npm run verify:midtrans` (signature + pemetaan status).
- Terapkan `supabase/schema.sql` ke DB setelah mengubahnya (idempoten). DB pooler:
  `postgres.<ref>@aws-0-ap-southeast-2.pooler.supabase.com:5432` (kredensial tidak
  disimpan di repo).
