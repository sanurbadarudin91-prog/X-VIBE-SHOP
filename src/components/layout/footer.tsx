import { BrandWordmark } from "@/components/layout/brand-logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card/50">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-8 text-center">
        <BrandWordmark showTagline />
        <p className="text-xs text-muted-foreground">
          ©2026 X-VIBE SHOP. design by alpha
        </p>
      </div>
    </footer>
  );
}
