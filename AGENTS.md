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

- Produksi: `https://x-vibe-shop.vercel.app` (team `x-vibe-cyber-development`,
  project `x-vibe-shop`, `prj_J4NKAUJAWWE6TpfqrR9BHW2PWxH8`).
- **Penting:** deploy produksi dipicu oleh push ke branch `main` (branch
  produksi Vercel). Push ke `feat/x-vibe-shop` hanya membuat *preview
  deployment* (dan preview dilindungi login Vercel). Jadi setelah fitur selesai
  di `feat/x-vibe-shop`, buka PR lalu **merge ke `main`** agar produksi ikut
  ter-update.
- Kredensial Vercel CLI tidak tersedia di sandbox; deploy mengandalkan
  integrasi Git Vercel (bukan `vercel --prod` dari CLI).

## Keamanan

- Jangan menulis nilai kredensial ke file yang di-commit (kunci Midtrans,
  service key Supabase, password DB, token GitHub). Rujuk nama env saja.
- Kredensial DB Supabase dipakai agen untuk menjalankan migrasi diambil dari
  riwayat percakapan/permintaan user, bukan dari repo.

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
- **Jangan hapus/pindahkan node DOM milik React secara manual** (mis.
  `element.remove()` pada elemen yang dirender komponen). React akan gagal
  merekonsiliasi pada navigasi client-side dan seluruh halaman menampilkan
  `Application error` (white screen) dengan error
  `Failed to execute insertBefore/removeChild on Node`. Kelola visibilitas
  lewat state React, bukan manipulasi DOM langsung.
- Jangan commit `.env.local`; `.env.example` hanya berisi placeholder.
- Jangan pernah menulis nilai kredensial (kunci Midtrans, service key Supabase,
  password DB, token GitHub) ke file yang di-commit — termasuk dokumentasi
  seperti file ini. Rujuk nama env-nya saja.

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
- Env Vercel + `.env.local` berisi `MIDTRANS_SERVER_KEY` /
  `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` (kunci sandbox, panjang 38, prefix `SB-`
  benar). Nilai kunci **tidak** ditulis di repo — ambil dari env/dashboard saja.
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

## STATUS: Fitur produk lanjutan (MIGRASI DB SUDAH DITERAPKAN)

**Kondisi:** kode SELESAI; migrasi `20261114_product_variants.sql` dan
`20261120_product_sizes_hex.sql` **sudah diterapkan ke DB Supabase**
(2026-11-15) sehingga semua fitur galeri/varian aktif.

- Migrasi diterapkan via koneksi Postgres langsung ke pooler
  `aws-0-ap-southeast-2.pooler.supabase.com:5432` (user `postgres.<ref>`),
  memakai klien Python `pg8000` karena `psql` tidak tersedia di sandbox.
  Berikutnya: SQL Editor Supabase, atau klien Postgres memakai kredensial DB
  dari dashboard. **Kredensial DB tidak disimpan di repo.**
- Alternatif: jalankan `supabase/seed.sql` untuk mengisi contoh varian + caption
  pada produk `Cyber Hoodie Black`.

## Perombakan UI/UX mobile + varian warna×ukuran (2026-11)

Fokus: tampilan ala aplikasi mobile modern, branding baru, i18n, dan varian
produk dua dimensi.

- **Varian dua dimensi:** `products.sizes jsonb` (daftar ukuran) +
  `products.color_hex jsonb` (map nama warna → kode hex untuk swatch).
  `cart_items.variant_size` & `order_items.variant_size` menyimpan ukuran.
  Kunci stok per kombinasi memakai `variant_key(color,size)` = `"Hitam|M"`;
  keranjang unik per `(user_id, product_id, coalesce(variant_color,''), coalesce(variant_size,''))`.
  `variant_available` / `variant_apply` mencari kunci gabungan → warna saja →
  ukuran saja → stok total, sehingga data varian warna lama tetap kompatibel.
- **Migrasi:** `supabase/migrations/20261120_product_sizes_hex.sql` (idempoten),
  sudah diterapkan ke DB produksi (2026-11-15). Bila di DB lain belum dijalankan,
  admin menampilkan pesan 42703 dan keranjang tetap jalan
  (kolom varian hanya ditulis bila ada nilai).
- **i18n:** `src/lib/i18n/dictionaries.ts` (12 bahasa, `MessageKey`), provider
  klien (`provider.tsx`, `useI18n` / `useOptionalI18n`), pembaca server
  (`server.ts`, `getTranslator`). Locale disimpan di cookie `xvs_locale`.
  Bahasa selain id/en hanya memuat subset kunci — sisanya jatuh ke en lalu id.
- **Layout mobile:** `bottom-nav.tsx` (Beranda, Katalog, Keranjang→drawer,
  Profil; `md:hidden`, `env(safe-area-inset-bottom)`), `brand-logo.tsx`
  (`BrandLogo`, `BrandWordmark`), `footer.tsx` ("©2026 X-VIBE SHOP. design by alpha"),
  `language-switcher.tsx`. Layout toko di `src/app/(shop)/layout.tsx` menambah
  `pb-20 md:pb-0` agar konten tidak tertutup bottom nav.
- **Header (`header.tsx`):** sengaja tanpa ikon keranjang dan tanpa tombol menu
  hamburger. Akses keranjang hanya lewat bottom nav (mobile) dan drawer; navigasi
  utama tampil di `md:flex`. Untuk pengguna login, header menampilkan ikon Profil
  dan Keluar (sign out) di semua ukuran layar. Logout juga tersedia di halaman
  profil lewat `src/components/profile/logout-button.tsx` (kunci `profile.logout`).
- **PWA:** `public/manifest.json`, `public/sw.js` (network-first + fallback
  `/offline`), ikon `public/icon-{192,512}.png` + `apple-touch-icon.png` +
  `favicon.png` (dibuat dari SVG via `sharp`), splash via komponen
  `src/components/layout/splash-screen.tsx`, pendaftaran SW di
  `src/components/layout/pwa-register.tsx`, halaman
  `src/app/offline/page.tsx`.
- **Admin:** `admin-sidebar.tsx` (sidebar + tab mobile, status aktif),
  `variant-editor.tsx` (warna + color picker hex + ukuran + matriks stok
  warna×ukuran), `product-images-uploader.tsx` (drag & drop multi-foto),
  `order-table.tsx` (cari/filter + ubah status 3 tahap: Menunggu, Dikirim,
  Diterima).
- **Util varian:** `src/lib/variants.ts` (`variantKey`, `variantStock`,
  `variantLabel`, `colorSwatch`).

## STATUS: Perombakan UI/UX mobile + varian warna×ukuran (SELESAI + MIGRASI OK)

**Kondisi:** kode SELESAI, ter-build, ter-lint. Migrasi
`supabase/migrations/20261120_product_sizes_hex.sql` **sudah diterapkan ke DB
Supabase** (2026-11-15): kolom `products.color_hex`, `products.sizes`,
`cart_items.variant_size`, `order_items.variant_size`, indeks unik keranjang
per warna+ukuran, dan fungsi `variant_key`/`variant_available`/`variant_apply`
serta `create_order`/`apply_stock_delta` sadar varian sudah aktif.
