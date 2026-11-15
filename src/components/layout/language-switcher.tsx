"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function choose(next: Locale) {
    setLocale(next);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size={compact ? "icon" : "sm"}
        aria-label="Ubah bahasa"
        title={LOCALE_META[locale].label}
        onClick={() => setOpen((v) => !v)}
        className={cn(!compact && "gap-1.5")}
      >
        <Globe className="h-5 w-5" />
        {!compact && (
          <span className="text-xs font-semibold uppercase">{locale}</span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-80 w-52 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-xl animate-fade-in">
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => choose(l)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-secondary",
                l === locale && "text-primary",
              )}
            >
              <span className="text-base leading-none">{LOCALE_META[l].flag}</span>
              <span className="min-w-0 flex-1 truncate">
                {LOCALE_META[l].nativeLabel}
              </span>
              {l === locale && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
