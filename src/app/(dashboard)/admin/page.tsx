import { AdminWorkspace } from "@/components/admin-workspace";
import { requireRole } from "@/lib/server/auth";
import { getAdminDashboardData } from "@/lib/server/research-service";

export default async function AdminPage() {
  const user = await requireRole("ADMIN");
  const data = await getAdminDashboardData(user.id);

  return <AdminWorkspace data={data} />;
}
