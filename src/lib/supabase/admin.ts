import { createClient as createServerClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Admin client using the service role key — bypasses RLS.
 * Use only for server-side operations that need elevated privileges
 * (e.g., registration flow, cron jobs).
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
