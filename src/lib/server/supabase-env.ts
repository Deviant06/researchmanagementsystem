const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function hasSupabasePublicEnv() {
  return Boolean(publicUrl && publicAnonKey);
}

export function hasSupabaseServiceEnv() {
  return Boolean(publicUrl && publicAnonKey && serviceRoleKey);
}

export function getSupabasePublicEnv() {
  if (!publicUrl || !publicAnonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return {
    url: publicUrl,
    anonKey: publicAnonKey
  };
}

export function getSupabaseServiceEnv() {
  if (!publicUrl || !publicAnonKey || !serviceRoleKey) {
    throw new Error(
      "Supabase admin access is not configured. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return {
    url: publicUrl,
    anonKey: publicAnonKey,
    serviceRoleKey
  };
}
