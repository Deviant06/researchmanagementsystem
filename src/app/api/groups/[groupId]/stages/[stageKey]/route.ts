import { getCurrentUser } from "@/lib/server/auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { stageUpdateSchema } from "@/lib/server/schemas";
import { updateStageDetails } from "@/lib/server/research-service";
import type { StageKey } from "@/lib/types";

interface RouteContext {
  params: {
    groupId: string;
    stageKey: StageKey;
  };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You need to sign in first.");
    }

    const body = stageUpdateSchema.parse(await request.json());
    await updateStageDetails(user, params.groupId, params.stageKey, body);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
