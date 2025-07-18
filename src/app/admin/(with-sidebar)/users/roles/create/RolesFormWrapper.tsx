"use client";
import RolesForm, { RolesFormValueType } from "../roles-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PermissionRecord } from "@/lib/entities/models/permission.model";
import { createRoleAction } from "../../role.action";
import { useBreadcrumbs } from "@/components/breadcrumb/breadcrumb-context";
import { useEffect } from "react";

export default function RolesFormWrapper({
  permissions,
}: {
  permissions: PermissionRecord[];
}) {
    const { setBreadcrumbs } = useBreadcrumbs();
  
    useEffect(() => {
      setBreadcrumbs([
        { label: "Admin", href: "/admin" },
        { label: "Roles", href: "/admin/roles" },
        { label: "Create", href: "/admin/roles/create" },
      ]);
    }, [setBreadcrumbs]);
    
  const router = useRouter();
  const handleSubmit = async (value: RolesFormValueType) => {
    const toastId = toast.loading("Loading…");
    const response = await createRoleAction(
      value.name,
      value.permissions,
      value.description || ""
    );
    if (response.status == "success") {
      toast.success(`Roles successfully created`, {
        id: toastId,
      });
      router.push("../roles");
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
        <h2 className="text-2xl font-bold tracking-tight">Create Roles</h2>
      </div>
    </div>
    <RolesForm
      isEditing={false}
      permissionsData={permissions}
      onSubmit={handleSubmit}
    />
    </div>
  );
}
