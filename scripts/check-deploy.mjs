#!/usr/bin/env node
/**
 * Verifikasi cepat setelah deploy.
 *
 *   node scripts/check-deploy.mjs https://x-vibe-shop.vercel.app
 *   node scripts/check-deploy.mjs http://localhost:3000
 *
 * Halaman publik harus 200; route terproteksi harus 3xx (redirect ke /login)
 * saat diakses tanpa sesi.
 */
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

const checks = [
  { path: "/", expect: [200], label: "Beranda" },
  { path: "/products", expect: [200], label: "Katalog" },
  { path: "/vouchers", expect: [200], label: "Voucher" },
  { path: "/login", expect: [200], label: "Login" },
  { path: "/checkout", expect: [301, 302, 303, 307, 308], label: "Checkout (terproteksi)" },
  { path: "/orders", expect: [301, 302, 303, 307, 308], label: "Pesanan (terproteksi)" },
  { path: "/profile", expect: [301, 302, 303, 307, 308], label: "Profil (terproteksi)" },
  { path: "/admin", expect: [301, 302, 303, 307, 308], label: "Admin (terproteksi)" },
];

let failed = 0;

for (const { path, expect, label } of checks) {
  let status = 0;
  try {
    const res = await fetch(`${base}${path}`, { redirect: "manual" });
    status = res.status;
  } catch (err) {
    console.log(`x ${label.padEnd(24)} ${path}  (${err.message})`);
    failed++;
    continue;
  }

  const ok = expect.includes(status);
  if (!ok) failed++;
  console.log(
    `${ok ? "OK " : "x  "} ${label.padEnd(24)} ${path}  -> ${status} (harap ${expect.join("/")})`,
  );
}

console.log(
  failed === 0
    ? `\nSemua ${checks.length} pemeriksaan lolos untuk ${base}`
    : `\n${failed} dari ${checks.length} pemeriksaan GAGAL untuk ${base}`,
);

process.exit(failed === 0 ? 0 : 1);
