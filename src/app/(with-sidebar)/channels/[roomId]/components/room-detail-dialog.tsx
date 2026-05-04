"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Hash,
  Globe,
  Lock,
  Trash2,
  Loader2,
  AlertTriangle,
  Info,
  Users,
  User,
  Shield,
  Calendar,
} from "lucide-react";
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
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface RoomDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomData: RoomWithParticipantsDTO;
  currentUserId: string;
  onUpdateRoom?: (data: Partial<RoomWithParticipantsDTO>) => void;
}

export function RoomDetailDialog({
  open,
  onOpenChange,
  roomData,
  currentUserId,
  onUpdateRoom,
}: RoomDetailDialogProps) {
  const [name, setName] = useState(roomData.name);
  const [description, setDescription] = useState(roomData.description ?? "");
  const [isPublic, setIsPublic] = useState(roomData.isPublic);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isOwner = currentUserId === roomData.ownerId;
  const isGeneral = roomData.id === "general-channel";
  const isDirect = roomData.isDirect;

  // Simulate loading to show skeleton if needed, but since we have roomData,
  // we only need this if we were fetching extra details.
  // For now, let's just use it to ensure a smooth transition.
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(true);
    }
  }, [open]);

  // Sync state when roomData changes
  useEffect(() => {
    setName(roomData.name);
    setDescription(roomData.description ?? "");
    setIsPublic(roomData.isPublic);
  }, [roomData]);

  const otherUser = isDirect
    ? roomData.participants.find((p) => p.user.id !== currentUserId)?.user
    : null;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama channel tidak boleh kosong");
      return;
    }

    if (onUpdateRoom) {
      onUpdateRoom({
        name: name.trim(),
        description: description.trim(),
        isPublic,
      });
    }

    setIsSaving(true);
    try {
      const response = await updateChannel(roomData.id, currentUserId, {
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });

      if (response.status === "success") {
        toast.success("Pengaturan berhasil disimpan!");
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
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden gap-0">
        <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/5 border-b">
          <div className="absolute -bottom-10 left-6 ring-4 ring-background rounded-2xl overflow-hidden shadow-xl">
            {isLoading ? (
              <Skeleton className="h-20 w-20 rounded-2xl" />
            ) : (
              <UserAvatar
                src={isDirect ? otherUser?.avatar || "" : roomData.avatar}
                alt={isDirect ? otherUser?.username || "" : roomData.name}
                className="h-20 w-20 rounded-2xl text-2xl"
              />
            )}
          </div>
        </div>

        <div className="pt-12 px-6 pb-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              {isLoading ? (
                <>
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {isDirect ? otherUser?.username : `#${roomData.name}`}
                    {!isDirect && (
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-bold tracking-wider py-0 px-1.5"
                      >
                        {isPublic ? "Public" : "Private"}
                      </Badge>
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    {isDirect ? (
                      <>
                      </>
                    ) : (
                      <>
                        <Users className="w-3.5 h-3.5" />{" "}
                        {roomData.participants.length} Anggota
                      </>
                    )}
                  </p>
                </>
              )}
            </div>
          </div>

          <Tabs defaultValue="overview" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview" className="gap-2">
                <Info className="w-4 h-4" /> Overview
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="gap-2"
                disabled={!isOwner && !isDirect}
              >
                <Settings className="w-4 h-4" />{" "}
                {isDirect ? "Profile" : "Settings"}
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[350px] mt-4">
              <TabsContent value="overview" className="mt-0 space-y-6">
                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                    Deskripsi
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-3 text-sm min-h-[60px]">
                    {isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ) : (
                      roomData.description || (
                        <span className="text-muted-foreground italic">
                          Tidak ada deskripsi.
                        </span>
                      )
                    )}
                  </div>
                </section>

                {!isDirect && (
                  <section className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                      Pemilik Channel
                    </h3>
                    <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                      {isLoading ? (
                        <>
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </>
                      ) : (
                        <>
                          <UserAvatar
                            src={
                              roomData.participants.find(
                                (p) => p.user.id === roomData.ownerId,
                              )?.user.avatar || ""
                            }
                            className="h-8 w-8"
                          />
                          <span className="text-sm font-medium">
                            {roomData.participants.find(
                              (p) => p.user.id === roomData.ownerId,
                            )?.user.username || "Unknown"}
                          </span>
                          <Shield className="w-3.5 h-3.5 text-primary ml-auto" />
                        </>
                      )}
                    </div>
                  </section>
                )}

                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                    Informasi
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 rounded-lg p-3 flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">
                        Dibuat
                      </span>
                      <span className="text-sm flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        - - -
                      </span>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">
                        ID
                      </span>
                      <span className="text-sm truncate">
                        {roomData.id.split("-")[0]}...
                      </span>
                    </div>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="settings" className="mt-0 space-y-5">
                {isOwner && !isDirect ? (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="channel-name">Nama Channel</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="channel-name"
                          value={name}
                          onChange={(e) =>
                            setName(
                              e.target.value.toLowerCase().replace(/\s+/g, "-"),
                            )
                          }
                          className="pl-9"
                          disabled={isSaving}
                          placeholder="nama-channel"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="channel-desc">Deskripsi</Label>
                      <Textarea
                        id="channel-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isSaving}
                        placeholder="Deskripsikan channel ini..."
                        className="resize-none"
                        rows={3}
                      />
                    </div>

                    <div
                      className={`flex items-center justify-between rounded-lg border p-4 bg-muted/30 transition
    ${isGeneral ? "opacity-50 pointer-events-none" : ""}
  `}
                    >
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
                            {isPublic ? "Dapat dicari" : "Hanya via undangan"}
                          </p>
                        </div>
                      </div>

                      <Switch
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                        disabled={isSaving || isGeneral}
                      />
                    </div>

                    {!isGeneral && (
                      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="w-4 h-4" />
                          <p className="text-sm font-semibold">
                            Zona Berbahaya
                          </p>
                        </div>
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
                              Hapus Channel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Hapus Channel #{roomData.name}?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Tindakan ini tidak dapat dibatalkan. Semua data
                                akan hilang selamanya.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Ya, Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                      >
                        Batal
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          "Simpan"
                        )}
                      </Button>
                    </div>
                  </>
                ) : isDirect ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Profil pengguna dan pengaturan DM akan segera hadir di
                      sini.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Anda tidak memiliki izin untuk mengubah pengaturan channel
                    ini.
                  </p>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
