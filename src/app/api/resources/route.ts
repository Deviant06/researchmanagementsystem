import { getCurrentUser } from "@/lib/server/auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { resourceSchema } from "@/lib/server/schemas";
import {
  getAdminDashboardData,
  getStudentDashboardData,
  uploadResource
} from "@/lib/server/research-service";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You need to sign in first.");
    }

    const data =
      user.role === "ADMIN"
        ? await getAdminDashboardData(user.id)
        : await getStudentDashboardData(user.id);

    return jsonOk({ resources: data.resources });
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

    const formData = await request.formData();
    const body = resourceSchema.parse({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      category: String(formData.get("category") ?? ""),
      externalUrl: String(formData.get("externalUrl") ?? "")
    });
    const maybeFile = formData.get("file");
    const file = maybeFile instanceof File ? maybeFile : null;

    await uploadResource(user, {
      ...body,
      externalUrl: body.externalUrl || undefined,
      file
    });

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
