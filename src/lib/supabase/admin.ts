import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client dengan service-role (secret) key.
 * HANYA untuk kode server-side tepercaya (admin actions, webhook).
 * Tidak pernah boleh dipakai di Client Component.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
