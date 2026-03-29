import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceEnv } from "@/lib/server/supabase-env";
import type { Database } from "@/lib/server/supabase-types";

export function createSupabaseAdminClient() {
  const env = getSupabaseServiceEnv();

  return createClient<Database>(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
