"use client";
import { toast } from "sonner";

import RolesForm, { RolesFormValueType } from "../../roles-form";
import { useParams, useRouter } from "next/navigation";
import { PermissionRecord } from "@/lib/entities/models/permission.model";
import { RoleRecord } from "@/lib/entities/models/role.model";
import { updateRoleAction } from "../../../role.action";
import { useBreadcrumbs } from "@/components/breadcrumb/breadcrumb-context";
import { useEffect } from "react";

export default function EditRolesFormWrapper({
  editingValue,
  permissions,
}: {
  editingValue: RoleRecord;
  permissions: PermissionRecord[];
}) {
    const { setBreadcrumbs } = useBreadcrumbs();
  
    useEffect(() => {
      setBreadcrumbs([
        { label: "Admin", href: "/admin" },
        { label: "Roles", href: "/admin/roles" },
        { label: "Edit", href: "/admin/roles/edit" },
      ]);
    }, [setBreadcrumbs]);

  let params = useParams<{ id: string }>();
  let router = useRouter();
  const handleSubmit = async (value: RolesFormValueType) => {
    const toastId = toast.loading("Loading…");

    const response = await updateRoleAction(
      params.id,
      value.name,
      value.permissions,
      value.description || ""
    );
    if (response.status == "success") {
      toast.success(`Role successfully updated`, {
        id: toastId,
      });
      router.push("../../roles");
    } else {
      toast.error(response.error?.message, {
        id: toastId,
      });
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col space-y-8 p-3 lg:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Edit Role</h2>
        </div>
      </div>
      <RolesForm
        isEditing={true}
        editingValue={editingValue}
        permissionsData={permissions}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
