import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Truck, TicketPercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/layout/search-bar";
import { ProductCard } from "@/components/product/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts } from "@/lib/queries";
import { getTranslator } from "@/lib/i18n/server";

export default async function HomePage() {
  const [products, { t }] = await Promise.all([
    getProducts({ sort: "newest" }),
    getTranslator(),
  ]);
  const flashSale = products.slice(0, 8);

  const perks = [
    {
      icon: Truck,
      title: t("home.perks.shipping.title"),
      desc: t("home.perks.shipping.desc"),
    },
    {
      icon: ShieldCheck,
      title: t("home.perks.payment.title"),
      desc: t("home.perks.payment.desc"),
    },
    {
      icon: TicketPercent,
      title: t("home.perks.voucher.title"),
      desc: t("home.perks.voucher.desc"),
    },
    {
      icon: Sparkles,
      title: t("home.perks.curated.title"),
      desc: t("home.perks.curated.desc"),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Search bar di bagian atas dashboard utama */}
      <div className="mb-5">
        <Suspense fallback={<Skeleton className="h-11 w-full" />}>
          <SearchBar />
        </Suspense>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/20 via-card to-accent/10 p-6 sm:p-10">
        <div className="relative z-10 max-w-2xl">
          <Badge className="mb-3" tone="default">
            {t("home.hero.badge")}
          </Badge>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {t("home.hero.title")}{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              X-VIBE-SHOP
            </span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            {t("home.hero.subtitle")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/products">
                {t("home.hero.shop")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/vouchers">{t("home.hero.claim")}</Link>
            </Button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {perks.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <p.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-2 text-sm font-semibold">{p.title}</h3>
            <p className="text-xs text-muted-foreground">{p.desc}</p>
          </div>
        ))}
      </section>

      {/* Section "Katalog Produk" diubah menjadi "Flash Sale" */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              {t("home.flashSale")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("home.flashSaleSub")}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href="/products">
              {t("home.viewAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {flashSale.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            {t("home.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {flashSale.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
