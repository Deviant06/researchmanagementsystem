import { redirect } from "next/navigation";

import type { Database } from "@/lib/server/supabase-types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/server/supabase-env";
import type { Role, SafeUser } from "@/lib/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function toSafeUser(profile: ProfileRow): SafeUser {
  return {
    id: profile.id,
    role: profile.role,
    name: profile.name,
    email: profile.email,
    groupId: profile.group_id,
    emailAlertsEnabled: profile.email_alerts,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    lastLoginAt: profile.last_login_at
  };
}

async function getProfileById(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    return null;
  }

  return data as ProfileRow | null;
}

export async function updateLastLogin(userId: string) {
  const admin = createSupabaseAdminClient();
  await admin
    .from("profiles")
    .update({
      last_login_at: new Date().toISOString()
    })
    .eq("id", userId);
}

export async function getCurrentUser() {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const profile = await getProfileById(user.id);
  return profile ? toSafeUser(profile) : null;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(role: Role) {
  const user = await requireUser();

  if (user.role !== role) {
    redirect("/dashboard");
  }

  return user;
}
