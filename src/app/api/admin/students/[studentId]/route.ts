import { getCurrentUser } from "@/lib/server/auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { studentSchema } from "@/lib/server/schemas";
import {
  deleteStudentAccount,
  updateStudentAccount
} from "@/lib/server/research-service";

interface RouteContext {
  params: {
    studentId: string;
  };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You need to sign in first.");
    }

    const body = studentSchema.parse(await request.json());
    await updateStudentAccount(user, params.studentId, body);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You need to sign in first.");
    }

    await deleteStudentAccount(user, params.studentId);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
