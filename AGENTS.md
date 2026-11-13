# AGENTS.md — X-VIBE-SHOP

Panduan singkat untuk agen yang bekerja di repo ini.

## Perintah

```bash
npm install
npm run dev        # dev server (http://localhost:3000)
npm run build      # build produksi
npm run lint       # ESLint (next lint)
npm run typecheck  # tsc --noEmit
```

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
