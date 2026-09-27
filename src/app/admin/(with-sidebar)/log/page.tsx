//src/app/(with-sidebar)/admin/users/page.tsx
import { adminGuard } from "@/lib/middlewares/role-guard.middleware";
import { getAllSessionsAction, getAllActivityLogsAction } from "./session.action";
import { redirect } from "next/navigation";
import { DataTableWrapper } from "./data-table-wrapper";

export default async function UserPage() {
  const isAdmin = await adminGuard();
  if (!isAdmin) redirect("/unauthorized");

  // Independent reads — the two admin tables have no data dependency.
  const [sessions, activityLogs] = await Promise.all([
    getAllSessionsAction(),
    getAllActivityLogsAction(),
  ]);

  return (
    <DataTableWrapper
      sessions={sessions}
      activityLogs={activityLogs}
    />
  );
}
