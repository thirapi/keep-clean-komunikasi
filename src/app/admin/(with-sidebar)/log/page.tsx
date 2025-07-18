//src/app/(with-sidebar)/admin/users/page.tsx
import { adminGuard } from "@/lib/middlewares/role-guard.middleware";
import { getAllSessionsAction } from "./session.action";
import { redirect } from "next/navigation";
import { DataTableWrapper } from "./data-table-wrapper";

export default async function UserPage() {
  const data = await getAllSessionsAction();
  const isAdmin = await adminGuard();
  if (!isAdmin) redirect("/unauthorized");

  return (
    <DataTableWrapper
      sessions={data}
    />
  );
}
