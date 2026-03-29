import { createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { loginSchema } from "@/lib/server/schemas";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { toSafeUser, updateLastLogin } from "@/lib/server/auth";
import type { Database } from "@/lib/server/supabase-types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error
    } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    });

    if (error || !user) {
      throw new Error(error?.message ?? "Invalid email or password.");
    }

    const admin = createSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const resolvedProfile = profile as ProfileRow | null;

    if (profileError || !resolvedProfile) {
      throw new Error(profileError?.message ?? "Profile not found.");
    }

    await updateLastLogin(user.id);

    return jsonOk({ user: toSafeUser(resolvedProfile) });
  } catch (error) {
    return jsonError(error);
  }
}
