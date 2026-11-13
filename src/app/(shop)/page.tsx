import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Truck, TicketPercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product/product-card";
import { getProducts } from "@/lib/queries";

export default async function HomePage() {
  const products = await getProducts({ sort: "newest" });
  const featured = products.slice(0, 8);

  const perks = [
    { icon: Truck, title: "Pengiriman Cepat", desc: "Dikirim dari gudang terdekat." },
    { icon: ShieldCheck, title: "Pembayaran Aman", desc: "Simulasi gateway terintegrasi." },
    { icon: TicketPercent, title: "Voucher & Diskon", desc: "Klaim voucher, hemat tiap belanja." },
    { icon: Sparkles, title: "Kurasi Produk", desc: "Apparel, digital, dan aksesoris pilihan." },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-card to-accent/10 p-8 sm:p-12">
        <div className="relative z-10 max-w-2xl">
          <Badge className="mb-4" tone="default">CYBER EDITION 2026</Badge>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Temukan Vibe Terbaik di{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              X-VIBE-SHOP
            </span>
          </h1>
          <p className="mt-4 text-muted-foreground sm:text-lg">
            Marketplace untuk apparel, produk digital, dan aksesoris bergaya
            cyberpunk. Belanja mudah, pembayaran cepat, harga bersahabat.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/products">
                Jelajahi Katalog <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/vouchers">Klaim Voucher</Link>
            </Button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
      </section>

      <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {perks.map((p) => (
          <div key={p.title} className="rounded-lg border border-border bg-card p-4">
            <p.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-2 text-sm font-semibold">{p.title}</h3>
            <p className="text-xs text-muted-foreground">{p.desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Produk Terbaru</h2>
            <p className="text-sm text-muted-foreground">Pilihan terbaru dari katalog kami.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/products">
              Lihat semua <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
            Belum ada produk. Admin dapat menambahkan produk dari dashboard.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
