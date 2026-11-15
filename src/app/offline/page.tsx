import Link from "next/link";
import { WifiOff } from "lucide-react";
import { BrandWordmark } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Mode Offline" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <BrandWordmark className="mb-6" />
      <WifiOff className="h-14 w-14 text-muted-foreground" />
      <h1 className="mt-4 text-2xl font-bold">Anda sedang offline</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Koneksi internet terputus. Periksa jaringan Anda lalu coba lagi.
      </p>
      <Button asChild className="mt-6 rounded-full">
        <Link href="/">Coba Lagi</Link>
      </Button>
    </div>
  );
}
