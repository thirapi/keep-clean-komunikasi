import { getAllPermissionsAction } from "../../role.action";
import RolesFormWrapper from "./RolesFormWrapper";

export default async function Page() {
  const permissionsResponse = await getAllPermissionsAction();

  const permissions = permissionsResponse.data ?? [];
  return <RolesFormWrapper permissions={permissions} />;
}
