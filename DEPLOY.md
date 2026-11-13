# Deploy X-VIBE-SHOP ke Vercel

Panduan langkah demi langkah. Repo sudah berisi `vercel.json`, jadi Vercel akan
otomatis mendeteksi Next.js.

## 1. Prasyarat

- Akun Vercel (boleh login pakai GitHub).
- Project Supabase yang sudah dijalankan `supabase/schema.sql` + `supabase/seed.sql`.
- Repo GitHub: `sanurbadarudin91-prog/X-VIBE-SHOP`.

## 2. Environment Variables

Set di **Vercel → Project → Settings → Environment Variables** (pilih
*Production*, *Preview*, dan *Development*). Jangan pernah menaruh nilai asli di
repo.

| Nama | Nilai | Catatan |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | publik |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | publik, dilindungi RLS |
| `SUPABASE_SECRET_KEY` | `sb_secret_...` | **rahasia**, hanya server |
| `NEXT_PUBLIC_SITE_URL` | `https://<domain>.vercel.app` | isi setelah domain diketahui |
| `PAYMENT_PROVIDER` | `mock` | placeholder |
| `PAYMENT_SERVER_KEY` | (kosong) | untuk gateway sungguhan nanti |

> Setelah mengubah env var, lakukan **Redeploy** agar berlaku.

## 3. Import project

1. Buka <https://vercel.com/new>.
2. Pilih repo **X-VIBE-SHOP** → **Import**.
3. Framework terdeteksi **Next.js**; biarkan Build/Output Command default.
4. Tambahkan Environment Variables dari tabel di atas.
5. Klik **Deploy**.

Atau lewat CLI:

```bash
npm i -g vercel
vercel login
vercel link            # hubungkan ke project
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
vercel env add SUPABASE_SECRET_KEY
vercel env add NEXT_PUBLIC_SITE_URL
vercel --prod          # deploy produksi
```

## 4. Konfigurasi Supabase (wajib untuk auth)

Buka **Supabase → Authentication → URL Configuration**:

- **Site URL**: `https://<domain>.vercel.app`
- **Redirect URLs** (tambahkan semuanya):
  - `https://<domain>.vercel.app/auth/callback`
  - `https://*-<team-or-username>.vercel.app/auth/callback` (preview deployment)
  - `http://localhost:3000/auth/callback` (lokal)

Buka **Authentication → Providers** dan aktifkan **Google** / **Facebook**
beserta Client ID & Secret dari masing-masing console.

## 5. Domain kustom (opsional)

**Settings → Domains → Add**. Setelah domain aktif, perbarui
`NEXT_PUBLIC_SITE_URL` dan Redirect URL Supabase agar memakai domain baru, lalu
redeploy.

## 6. Verifikasi setelah deploy

```bash
# Halaman publik harus 200
curl -o /dev/null -w "%{http_code}\n" https://<domain>/
curl -o /dev/null -w "%{http_code}\n" https://<domain>/products

# Route terproteksi harus 307 (redirect ke /login) untuk tamu
curl -o /dev/null -w "%{http_code}\n" https://<domain>/checkout
```

Lalu uji manual: login (email + Google/Facebook), tambah ke keranjang, checkout,
bayar (simulasi), dan buka `/admin` sebagai admin.

## 7. Deployment Protection

Preview deployment Vercel secara default dilindungi (butuh login Vercel).
Untuk menguji preview secara otomatis, buat **Protection Bypass for Automation**
di *Settings → Deployment Protection* lalu akses dengan header
`x-vercel-protection-bypass: <secret>` atau query `?x-vercel-protection-bypass=<secret>`.
Alternatif: setel Vercel Authentication ke *Only Production Deployments*.

## 8. Catatan keamanan

- `SUPABASE_SECRET_KEY` bersifat rahasia — jangan pernah diberi prefix
  `NEXT_PUBLIC_` dan jangan ditaruh di kode client.
- Rotasi kredensial bila pernah terekspos (lihat riwayat percakapan).
- `.env.local` sudah di-`.gitignore`; `vercel env pull` menulis `.env.local`
  (juga terabaikan).
