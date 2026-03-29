import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicEnv } from "@/lib/server/supabase-env";
import type { Database } from "@/lib/server/supabase-types";

export function createSupabaseServerClient() {
  const env = getSupabasePublicEnv();
  const cookieStore = cookies();

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components can be read-only. Middleware refreshes auth cookies.
        }
      }
    }
  });
}
