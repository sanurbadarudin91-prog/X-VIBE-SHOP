import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client untuk dipakai di komponen Client ("use client").
 * Memakai publishable key yang dilindungi Row Level Security.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
