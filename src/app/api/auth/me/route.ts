import { getCurrentUser } from "@/lib/server/auth";
import { jsonError, jsonOk } from "@/lib/server/http";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You need to sign in first.");
    }

    return jsonOk({ user });
  } catch (error) {
    return jsonError(error);
  }
}
