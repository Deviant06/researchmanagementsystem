import { getCurrentUser } from "@/lib/server/auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { studentSchema } from "@/lib/server/schemas";
import {
  createStudentAccount,
  getAdminDashboardData
} from "@/lib/server/research-service";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You need to sign in first.");
    }

    return jsonOk(await getAdminDashboardData(user.id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You need to sign in first.");
    }

    const body = studentSchema.parse(await request.json());
    const result = await createStudentAccount(user, body);

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
