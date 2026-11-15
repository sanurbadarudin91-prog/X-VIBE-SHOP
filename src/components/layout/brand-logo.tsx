import { cn } from "@/lib/utils";

/**
 * Logo utama X-VIBE: monogram "XV" bergaya cyber. Dipakai konsisten di header,
 * footer, layar splash, ikon PWA, dan panel admin.
 */
export function BrandLogo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role="img"
      aria-label="Logo X-VIBE"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="xv-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="46"
        height="46"
        rx="12"
        fill="url(#xv-logo-grad)"
      />
      <path
        d="M12 14 L19.5 24 L12 34"
        fill="none"
        stroke="white"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5 14 L36 34 M36 14 L20.5 34"
        fill="none"
        stroke="white"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Logo + wordmark lengkap: "X-VIBE-SHOP". */
export function BrandWordmark({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <BrandLogo size={32} />
      <span className="flex flex-col leading-none">
        <span className="font-bold tracking-tight">
          X-VIBE<span className="text-primary">-SHOP</span>
        </span>
        {showTagline && (
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            X-VIBE Cyber Development
          </span>
        )}
      </span>
    </span>
  );
}
