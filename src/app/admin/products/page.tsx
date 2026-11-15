import { ProductManager } from "@/components/admin/product-manager";
import { getProducts } from "@/lib/queries";

export const metadata = { title: "Manajemen Produk" };

export default async function AdminProductsPage() {
  const products = await getProducts({ sort: "newest" });
  return <ProductManager products={products} />;
}
