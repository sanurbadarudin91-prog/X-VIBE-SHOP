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
- `src/app/admin/` — Ringkasan (`page.tsx`), Produk, Pesanan, Pelanggan
  (`customers/`), Voucher. Komponen di `src/components/admin/`.
- `src/lib/actions/` — Next.js Server Actions (mutasi data).
- `src/lib/queries.ts` — pembacaan data server-side (termasuk query admin:
  `getAdminStats`, `getRevenueSeries`, `getLowStockProducts`, `getAdminCustomers`).
- `src/lib/supabase/` — client (browser/server/admin) + middleware.
- `supabase/schema.sql` — DDL + RLS + trigger + fungsi RPC (idempoten).
- `supabase/migrations/` — migrasi inkremental idempoten untuk DB yang sudah jalan
  (mis. `20261114_product_variants.sql`). Jalankan di SQL Editor Supabase bila
  tidak punya kredensial psql.
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

## STATUS: Payment Gateway Midtrans (DIPARKIR)

**Kondisi:** integrasi kode SELESAI & terbukti. Menunggu kunci valid dari user
(user sedang menghubungi CS Midtrans; kemungkinan masalah di akun Midtrans).

- Kode: `src/lib/payments/midtrans.ts`, Server Action `createSnapSession`,
  webhook `src/app/api/payment/midtrans/webhook/route.ts`, tombol Bayar di
  `src/components/order-card.tsx`. Semua ter-commit & ter-deploy.
- **Tidak ada** validasi prefix `SB-` di kode mana pun (sudah diaudit).
- Env Vercel + `.env.local` berisi `SB-Mid-server-WESXb30atZ-Jq30hEaifRu5y` /
  `SB-Mid-client-mAcNPy5QWkKdK0ps` (tersimpan utuh, panjang 38, prefix benar).
- **BLOCKER:** Midtrans membalas `401 {"error":"Unauthorized"}` untuk SEMUA
  varian kunci (dengan/tanpa `SB-`) di endpoint sandbox & produksi, diuji dari
  region Vercel `sin1` juga. Kunci sampah pun 401 identik → Midtrans tidak
  mengenali kunci tsb.
- **Jalur webhook SUDAH terbukti 100%** (diuji end-to-end di produksi: status
  `paid`, stok 18→17, idempotent, nominal salah→400). Jadi begitu kunci valid
  masuk, cukup update env lalu deploy; tidak perlu ubah kode.
- **Cara lanjut:** user akan mengirim instruksi "lanjutkan payment gateway nya
  hands". Tindakan: perbarui `MIDTRANS_SERVER_KEY` + `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`
  (Vercel 3 env + `.env.local`) dengan kunci baru dari user, deploy, lalu uji
  `createSnapSession`/popup Snap sampai token berhasil dibuat.

## Fitur produk lanjutan (galeri multi-foto + varian warna)

- Kolom `products`: `images jsonb` (galeri, foto pertama = `image_url`),
  `colors jsonb` (daftar nama warna), `variant_stock jsonb` (stok per warna),
  `caption text` (deskripsi kaya, ditampilkan apa adanya dengan `whitespace-pre-line`).
- `cart_items.variant_color` & `order_items.variant_color` menyimpan warna yang dibeli.
  Keranjang unik per `(user_id, product_id, coalesce(variant_color,''))`.
- Bila produk punya varian warna, `products.stock` = jumlah stok semua varian
  (dihitung ulang di `saveProduct`). RPC `create_order` memvalidasi stok per warna,
  `apply_stock_delta` mengurangi/mengembalikan stok varian yang sesuai.
- Komponen: `product-images-uploader.tsx` (unggah maks 10 foto, bucket
  `product-images`), `variant-color-editor.tsx`, `product-purchase-panel.tsx`.
  Batas foto/ukuran: `src/lib/product-constants.ts`.
- **Catatan Next.js:** file `"use server"` hanya boleh mengekspor fungsi async —
  konstanta bersama (mis. `MAX_PRODUCT_IMAGES`) harus di modul terpisah, bukan di
  `src/lib/actions/*.ts`.
- `deleteProduct` menghapus baris produk lalu membersihkan file di bucket
  `product-images` (best-effort; kegagalan storage tidak menggagalkan hapus).

## STATUS: Fitur produk lanjutan (MENUNGGU MIGRASI DB)

**Kondisi:** kode SELESAI, ter-build, ter-push, dan ter-deploy ke produksi.
Tinggal satu langkah manual: menjalankan migrasi kolom baru ke DB Supabase
(tidak ada kredensial DB di repo/agen).

- Jalankan `supabase/migrations/20261114_product_variants.sql` di Supabase
  SQL Editor (idempoten; aman diulang). Migrasi ini menambah
  `products.caption/images/colors/variant_stock`, `cart_items.variant_color`,
  `order_items.variant_color`, indeks keranjang per-warna, fungsi
  `apply_stock_delta` + `create_order` sadar varian, dan bucket `product-images`.
- **Sebelum migrasi dijalankan:** admin gagal menyimpan produk dengan pesan
  "Skema database belum mendukung galeri/varian…" (kode galat 42703). Fitur lama
  tetap normal; keranjang tetap jalan (kolom varian hanya disentuh bila ada warna).
- **Setelah migrasi:** semua fitur aktif tanpa perlu deploy ulang.
- Alternatif: jalankan `supabase/seed.sql` untuk mengisi contoh varian + caption
  pada produk `Cyber Hoodie Black`.
