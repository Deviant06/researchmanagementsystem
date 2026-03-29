import { getCurrentUser } from "@/lib/server/auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { getNotificationForUser } from "@/lib/server/research-service";

interface RouteContext {
  params: {
    notificationId: string;
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You need to sign in first.");
    }

    return jsonOk({
      notification: await getNotificationForUser(user, params.notificationId)
    });
  } catch (error) {
    return jsonError(error);
  }
}
