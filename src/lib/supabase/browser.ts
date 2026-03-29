"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/server/supabase-types";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createSupabaseBrowserClient() {
  if (!client) {
    const env = getSupabasePublicEnv();
    client = createBrowserClient<Database>(env.url, env.anonKey);
  }

  return client;
}
