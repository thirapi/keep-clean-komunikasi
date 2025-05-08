import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import EditRolesFormWrapper from "./EditFormWrapper";
import {
  getAllPermissionsAction,
  getRoleByIdAction,
} from "../../../role.action";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const roleId = (await params).id;
  const roleData = getRoleByIdAction(roleId);
  const permissionsResponse = getAllPermissionsAction();

  const [roleDataRes, permissionResponse] = await Promise.all([
    roleData,
    permissionsResponse,
  ]);
  const permissions = permissionResponse.data ?? [];
  if (!roleDataRes.data) {
    throw new Error(roleDataRes.error?.message);
  }
  const editData = roleDataRes.data;

  return <EditRolesFormWrapper editingValue={editData} permissions={permissions} />;
}
