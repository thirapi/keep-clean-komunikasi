//src/app/(with-sidebar)/admin/users/page.tsx
import { adminGuard } from "@/lib/middlewares/role-guard.middleware";
import { getAllRolesAction, getAllUsersWithRoles } from "../role.action";
import { redirect } from "next/navigation";
import { DataTableWrapper } from "./data-table-wrapper";
import { getUserSession } from "@/app/auth.action";

export default async function UserPage() {
  const session = await getUserSession();
  const data = await getAllUsersWithRoles();
  const allRoles = await getAllRolesAction();
  const isAdmin = await adminGuard();
  if (!isAdmin) redirect("/unauthorized");

  return <DataTableWrapper allRoles={allRoles} />;
}
