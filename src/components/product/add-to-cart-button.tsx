"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { addToCart } from "@/lib/actions/cart";
import { useOptionalI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function AddToCartButton({
  productId,
  stock,
  variantColor = null,
  variantSize = null,
  buyNow = false,
  className,
  fullWidth = false,
}: {
  productId: string;
  stock: number;
  variantColor?: string | null;
  variantSize?: string | null;
  buyNow?: boolean;
  className?: string;
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const { t } = useOptionalI18n();
  const { refresh } = useCart();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const disabled = stock <= 0;

  function handleClick() {
    if (disabled) return;
    startTransition(async () => {
      const res = await addToCart(productId, 1, variantColor, variantSize);
      if (!res.ok) {
        toast.error(res.message);
        if (res.message.includes("login")) router.push("/login");
        return;
      }
      await refresh();
      if (buyNow) {
        router.push("/checkout");
        return;
      }
      // Umpan balik visual cukup lewat toast (auto-hilang 2 detik) agar tidak
      // menumpuk dengan drawer keranjang.
      toast.success(t("product.addedToast"), { duration: 2000 });
      setDone(true);
      setTimeout(() => setDone(false), 1200);
    });
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      loading={pending}
      variant={buyNow ? "default" : "secondary"}
      className={cn(fullWidth && "w-full", className)}
    >
      {!pending &&
        (buyNow ? <Zap className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />)}
      {disabled
        ? t("product.outOfStock")
        : buyNow
          ? t("product.buyNow")
          : done
            ? t("product.added")
            : t("product.addToCart")}
    </Button>
  );
}
