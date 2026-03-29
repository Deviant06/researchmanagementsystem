import { getCurrentUser } from "@/lib/server/auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { deleteResource } from "@/lib/server/research-service";

interface RouteContext {
  params: {
    resourceId: string;
  };
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You need to sign in first.");
    }

    await deleteResource(user, params.resourceId);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
