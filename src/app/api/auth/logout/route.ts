import { createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonOk } from "@/lib/server/http";

export async function POST() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  return jsonOk({ success: true });
}
