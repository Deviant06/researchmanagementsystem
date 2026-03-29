import { getCurrentUser } from "@/lib/server/auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { addressComment } from "@/lib/server/research-service";

interface RouteContext {
  params: {
    commentId: string;
  };
}

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You need to sign in first.");
    }

    await addressComment(user, params.commentId);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
