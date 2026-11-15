"use client";

import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { cn } from "@/lib/utils";

const FADE_MS = 400;
const HOLD_MS = 900;

/**
 * Splash screen singkat ala aplikasi mobile native.
 *
 * Dikelola penuh oleh state React (bukan `element.remove()` manual) agar tidak
 * merusak pohon DOM yang direkonsiliasi React saat navigasi client-side.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const hold = window.setTimeout(() => setFading(true), HOLD_MS);
    const remove = window.setTimeout(() => setVisible(false), HOLD_MS + FADE_MS);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(remove);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-0 z-[100] grid place-items-center bg-background transition-opacity duration-500",
        fading && "pointer-events-none opacity-0",
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <BrandLogo size={64} className="animate-pulse" />
        <span className="text-sm font-semibold tracking-wide">
          X-VIBE<span className="text-primary">-SHOP</span>
        </span>
      </div>
    </div>
  );
}
