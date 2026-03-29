import { getCurrentUser } from "@/lib/server/auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { commentSchema } from "@/lib/server/schemas";
import { createComment } from "@/lib/server/research-service";
import type { StageKey } from "@/lib/types";

interface RouteContext {
  params: {
    groupId: string;
    stageKey: StageKey;
  };
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You need to sign in first.");
    }

    const body = commentSchema.parse(await request.json());
    await createComment(user, params.groupId, params.stageKey, body);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
