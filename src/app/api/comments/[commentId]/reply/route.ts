import { getCurrentUser } from "@/lib/server/auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { replySchema } from "@/lib/server/schemas";
import { replyToComment } from "@/lib/server/research-service";

interface RouteContext {
  params: {
    commentId: string;
  };
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You need to sign in first.");
    }

    const body = replySchema.parse(await request.json());
    await replyToComment(user, params.commentId, body.text);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
