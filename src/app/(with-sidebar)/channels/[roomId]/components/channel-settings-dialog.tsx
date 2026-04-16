"use client";

import { useState } from "react";
import { Settings, Hash, Globe, Lock, Trash2, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { updateChannel, deleteChannel } from "../room.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ChannelSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomData: RoomWithParticipantsDTO;
  currentUserId: string;
}

export function ChannelSettingsDialog({
  open,
  onOpenChange,
  roomData,
  currentUserId,
}: ChannelSettingsDialogProps) {
  const [name, setName] = useState(roomData.name);
  const [description, setDescription] = useState(roomData.description ?? "");
  const [isPublic, setIsPublic] = useState(roomData.isPublic);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const isOwner = currentUserId === roomData.ownerId;
  const isGeneral = roomData.id === "general-channel";

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama channel tidak boleh kosong");
      return;
    }

    setIsSaving(true);
    try {
      const response = await updateChannel(roomData.id, currentUserId, {
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });

      if (response.status === "success") {
        toast.success("Pengaturan channel berhasil disimpan!");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(response.error?.message ?? "Gagal menyimpan pengaturan");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteChannel(roomData.id, currentUserId);

      if (response.status === "success") {
        toast.success("Channel berhasil dihapus");
        onOpenChange(false);
        router.push("/channels");
        router.refresh();
      } else {
        toast.error(response.error?.message ?? "Gagal menghapus channel");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Pengaturan Channel
          </DialogTitle>
          <DialogDescription>
            Kelola pengaturan untuk channel <span className="font-semibold text-foreground">#{roomData.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* Channel Name */}
          <div className="grid gap-2">
            <Label htmlFor="channel-name">Nama Channel</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="channel-name"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                className="pl-9"
                disabled={!isOwner || isSaving}
                placeholder="nama-channel"
              />
            </div>
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="channel-desc">Deskripsi</Label>
            <Textarea
              id="channel-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isOwner || isSaving}
              placeholder="Deskripsikan channel ini..."
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="w-4 h-4 text-emerald-500" />
              ) : (
                <Lock className="w-4 h-4 text-amber-500" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {isPublic ? "Channel Publik" : "Channel Privat"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPublic
                    ? "Semua orang bisa menemukan dan bergabung"
                    : "Hanya orang yang diundang"}
                </p>
              </div>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={!isOwner || isSaving}
            />
          </div>

          {/* Danger Zone */}
          {isOwner && !isGeneral && (
            <>
              <Separator />
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <p className="text-sm font-semibold text-destructive">Zona Berbahaya</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tindakan berikut bersifat permanen dan tidak dapat dibatalkan.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full gap-2"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Hapus Channel Ini
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Channel #{roomData.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Semua pesan dan anggota di channel ini akan dihapus secara permanen.
                        Tindakan ini <strong>tidak dapat dibatalkan</strong>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Ya, Hapus Channel
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </div>

        {isOwner && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
