"use client";

import { Row } from "@tanstack/react-table";
import { DotsThree } from "@phosphor-icons/react/dist/ssr";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RoleRecord } from "@/lib/entities/models/role.model";
import { deleteRoleAction } from "../../role.action";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions({
  row,
}: DataTableRowActionsProps<RoleRecord>) {
  const router = useRouter();
  const handleOnDelete = async () => {
    const toastId = toast.loading("Deleting role...");

    const response = await deleteRoleAction(row.original.id);
    if (response.status === "error") {
        toast.error(response.error?.message || "An unknown error occurred", { id: toastId });
    } else {
        toast.success("Success deleting role!", { id: toastId });
        router.refresh();
    }
  };

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsThree weight="duotone" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem asChild>
            <Link href={`./roles/${row.original.id}/edit`}>Edit</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <AlertDialogTrigger className="w-full">Delete</AlertDialogTrigger>
            {/* <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut> */}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete role
            from this system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleOnDelete}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
