import { StudentWorkspace } from "@/components/student-workspace";
import { requireRole } from "@/lib/server/auth";
import { getStudentDashboardData } from "@/lib/server/research-service";

export default async function StudentPage() {
  const user = await requireRole("STUDENT");
  const data = await getStudentDashboardData(user.id);

  return <StudentWorkspace data={data} />;
}
