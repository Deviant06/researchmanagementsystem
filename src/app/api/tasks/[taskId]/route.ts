import { getCurrentUser } from "@/lib/server/auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { taskSchema } from "@/lib/server/schemas";
import { updateTask } from "@/lib/server/research-service";

interface RouteContext {
  params: {
    taskId: string;
  };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You need to sign in first.");
    }

    const body = taskSchema.parse(await request.json());
    await updateTask(user, params.taskId, body);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
