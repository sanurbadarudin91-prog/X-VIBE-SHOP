import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Star, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductGallery } from "@/components/product/product-gallery";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { getProduct } from "@/lib/queries";
import { formatIDR } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product?.title ?? "Produk" };
}

// Ulasan contoh (belum ada tabel reviews pada skema).
const SAMPLE_REVIEWS = [
  { name: "Raka", rating: 5, text: "Kualitas bagus, sesuai deskripsi. Pengiriman cepat!" },
  { name: "Dinda", rating: 4, text: "Produk oke, packing rapi. Recommended." },
  { name: "Bagas", rating: 5, text: "Worth it banget untuk harganya." },
];

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const gallery = product.image_url ? [product.image_url] : [];
  const avgRating =
    SAMPLE_REVIEWS.reduce((s, r) => s + r.rating, 0) / SAMPLE_REVIEWS.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/products">
          <ArrowLeft className="h-4 w-4" /> Kembali ke katalog
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={gallery} alt={product.title} />

        <div>
          <Badge tone="muted">{product.category}</Badge>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {product.title}
          </h1>

          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="flex items-center gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4"
                  fill={i < Math.round(avgRating) ? "currentColor" : "none"}
                />
              ))}
            </span>
            <span className="text-muted-foreground">
              {avgRating.toFixed(1)} • {SAMPLE_REVIEWS.length} ulasan
            </span>
          </div>

          <p className="mt-5 text-3xl font-extrabold text-primary">
            {formatIDR(product.price)}
          </p>

          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Truck className="h-4 w-4" /> Estimasi 1–3 hari
            </span>
            {product.stock > 0 ? (
              <Badge tone="success">Stok tersedia: {product.stock}</Badge>
            ) : (
              <Badge tone="danger">Stok habis</Badge>
            )}
          </div>

          <p className="mt-5 whitespace-pre-line leading-relaxed text-muted-foreground">
            {product.description || "Belum ada deskripsi untuk produk ini."}
          </p>

          <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
            {["Garansi kualitas produk", "Bisa retur 7 hari", "Pembayaran aman"].map(
              (f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" /> {f}
                </li>
              ),
            )}
          </ul>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <AddToCartButton productId={product.id} stock={product.stock} className="flex-1" />
            <AddToCartButton
              productId={product.id}
              stock={product.stock}
              buyNow
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold">Ulasan Pembeli</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {SAMPLE_REVIEWS.map((r) => (
            <div key={r.name} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.name}</span>
                <span className="flex text-amber-500">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5" fill="currentColor" />
                  ))}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
