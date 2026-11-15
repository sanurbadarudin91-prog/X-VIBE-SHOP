import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/layout/pwa-register";
import { SplashScreen } from "@/components/layout/splash-screen";

export const metadata: Metadata = {
  title: {
    default: "X-VIBE-SHOP — Marketplace Cyberpunk",
    template: "%s | X-VIBE-SHOP",
  },
  description:
    "X-VIBE-SHOP: marketplace modern untuk apparel, produk digital, dan aksesoris.",
  applicationName: "X-VIBE-SHOP",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "X-VIBE-SHOP",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#22d3ee",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <SplashScreen />
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
