import { getCurrentUser } from "@/lib/server/auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { createSubmission } from "@/lib/server/research-service";
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

    const formData = await request.formData();
    const content = String(formData.get("content") ?? "");
    const maybeFile = formData.get("file");
    const file = maybeFile instanceof File ? maybeFile : null;

    await createSubmission(user, params.groupId, params.stageKey, {
      content,
      file
    });

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
