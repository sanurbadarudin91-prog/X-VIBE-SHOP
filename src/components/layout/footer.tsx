import Link from "next/link";
import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
              X
            </span>
            <span className="font-bold">X-VIBE-SHOP</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Marketplace modern untuk apparel, produk digital, dan aksesoris
            bergaya cyberpunk.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Belanja</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/products" className="hover:text-foreground">Semua Produk</Link></li>
            <li><Link href="/products?category=Apparel" className="hover:text-foreground">Apparel</Link></li>
            <li><Link href="/products?category=Digital" className="hover:text-foreground">Digital</Link></li>
            <li><Link href="/products?category=Aksesoris" className="hover:text-foreground">Aksesoris</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Akun</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/profile" className="hover:text-foreground">Profil</Link></li>
            <li><Link href="/orders" className="hover:text-foreground">Pesanan</Link></li>
            <li><Link href="/vouchers" className="hover:text-foreground">Voucher</Link></li>
            <li><Link href="/cart" className="hover:text-foreground">Keranjang</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Lainnya</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/admin" className="hover:text-foreground">Admin Dashboard</Link></li>
            <li>
              <span className="inline-flex items-center gap-1">
                <Github className="h-3.5 w-3.5" /> Next.js + Supabase
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} X-VIBE-SHOP. Dibuat dengan Next.js &
        Supabase. Pembayaran masih dalam mode simulasi.
      </div>
    </footer>
  );
}
