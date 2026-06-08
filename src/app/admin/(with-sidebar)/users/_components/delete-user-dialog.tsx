"use client";

import { useState } from "react";
import { Trash, CircleNotch, Warning } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
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
import { deleteUserAction } from "../role.action";
import { toast } from "sonner";

interface DeleteUserDialogProps {
  targetUserId: string;
  username: string;
  actorUserId: string;
}

export function DeleteUserDialog({
  targetUserId,
  username,
  actorUserId,
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteUserAction(actorUserId, targetUserId);
      if (res.status === "success") {
        toast.success(`User @${username} berhasil dihapus`);
        setOpen(false);
      } else {
        toast.error(res.error?.message || "Gagal menghapus user");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash weight="duotone" className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Warning weight="fill" className="text-destructive h-5 w-5" />
            Hapus User @{username}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. Seluruh data user termasuk post, pesan, dan pengaturan akan dihapus secara permanen dari server.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <CircleNotch className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Hapus Permanen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
