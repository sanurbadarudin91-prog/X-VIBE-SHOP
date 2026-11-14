import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "X-VIBE-SHOP — Marketplace Cyberpunk",
    template: "%s | X-VIBE-SHOP",
  },
  description:
    "X-VIBE-SHOP: marketplace modern untuk apparel, produk digital, dan aksesoris.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
