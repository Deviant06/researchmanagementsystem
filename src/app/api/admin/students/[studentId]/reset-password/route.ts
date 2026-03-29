import { getCurrentUser } from "@/lib/server/auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { resetStudentPassword } from "@/lib/server/research-service";

interface RouteContext {
  params: {
    studentId: string;
  };
}

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You need to sign in first.");
    }

    const result = await resetStudentPassword(user, params.studentId);

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
