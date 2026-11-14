import { Suspense } from "react";
import { ProductCard } from "@/components/product/product-card";
import { CatalogControls } from "@/components/product/catalog-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategories, getProducts } from "@/lib/queries";
import type { ProductQuery } from "@/lib/queries";

export const metadata = { title: "Katalog Produk" };

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}

async function ProductGrid({ params }: { params: ProductQuery }) {
  const products = await getProducts(params);

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
        Tidak ada produk yang cocok dengan pencarian Anda.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { q, category, sort } = await searchParams;
  const categories = await getCategories();
  const params: ProductQuery = {
    q,
    category,
    sort: (sort as ProductQuery["sort"]) ?? "newest",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Katalog Produk</h1>
        <p className="text-sm text-muted-foreground">
          {q ? `Hasil pencarian untuk "${q}"` : "Jelajahi semua produk X-VIBE-SHOP."}
        </p>
      </header>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <CatalogControls categories={categories} />
      </Suspense>

      <div className="mt-6">
        <Suspense
          key={`${q}-${category}-${sort}`}
          fallback={
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full" />
              ))}
            </div>
          }
        >
          <ProductGrid params={params} />
        </Suspense>
      </div>
    </div>
  );
}
