"use client";

import { useState, useEffect, useRef } from "react";
import { Gear, Hash, Globe, Lock, Trash, CircleNotch, Warning, Info, Users, User, Shield, Calendar, Camera, X, SignOut, UserMinus, Sparkle, DotsThreeVertical, Crown } from "@phosphor-icons/react/dist/ssr";
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
import { updateChannel, deleteChannel, removeParticipant } from "../room.action";
import { uploadFileAction } from "../messages.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RoomDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomData: RoomWithParticipantsDTO;
  currentUserId: string;
  onUpdateRoom?: (data: Partial<RoomWithParticipantsDTO>) => void;
}

const bannerPresets = [
  "linear-gradient(to right, #4f46e5, #7c3aed)",
  "linear-gradient(to right, #06b6d4, #3b82f6)",
  "linear-gradient(to right, #10b981, #3b82f6)",
  "linear-gradient(to right, #f59e0b, #ef4444)",
  "#1e293b",
  "#475569",
];

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
  const [banner, setBanner] = useState(roomData.banner || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBannerUploading, setIsBannerUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
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
      setAvatarPreview(null);
      setAvatarFile(null);
      setIsLeaving(false);
    }
  }, [open]);

  const [isLeaving, setIsLeaving] = useState(false);

  const isDirty =
    name !== roomData.name ||
    description !== (roomData.description || "") ||
    isPublic !== roomData.isPublic ||
    banner !== (roomData.banner || "") ||
    avatarFile !== null;

  // Sync state when roomData changes
  useEffect(() => {
    setName(roomData.name);
    setDescription(roomData.description ?? "");
    setIsPublic(roomData.isPublic);
    setBanner(roomData.banner || "");
  }, [roomData]);

  const otherUser = isDirect
    ? roomData.participants.find((p) => p.user.id !== currentUserId)?.user
    : null;

  const currentAvatarSrc = avatarPreview || (isDirect ? otherUser?.avatar || "" : roomData.avatar);
  const currentAvatarName = isDirect ? otherUser?.username || "" : roomData.name;

  const handleAvatarClick = () => {
    if (isOwner && !isDirect) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran banner maksimal 5MB");
      return;
    }

    setIsBannerUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await uploadFileAction(formData, "room-banners");

      if (response.status === "success" && response.data) {
        setBanner(response.data.fileurl);
        toast.success("Banner berhasil diunggah!");
      } else {
        toast.error(response.error?.message || "Gagal mengunggah banner");
      }
    } finally {
      setIsBannerUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama channel tidak boleh kosong");
      return;
    }

    setIsSaving(true);
    try {
      let avatarUrl = roomData.avatar;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const uploadRes = await uploadFileAction(formData, "room-avatars");
        if (uploadRes.status === "success" && uploadRes.data) {
          avatarUrl = uploadRes.data.fileurl;
        } else {
          toast.error("Gagal mengunggah avatar");
          setIsSaving(false);
          return;
        }
      }

      if (onUpdateRoom) {
        onUpdateRoom({
          name: name.trim(),
          description: description.trim(),
          isPublic,
          avatar: avatarUrl,
          banner: banner || null,
        });
      }

      const response = await updateChannel(roomData.id, currentUserId, {
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
        avatar: avatarUrl,
        banner: banner || undefined,
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

  const handleLeaveRoom = async () => {
    setIsLeaving(true);
    try {
      const response = await removeParticipant(roomData.id, currentUserId, currentUserId);
      if (response.status === "success") {
        toast.success("Berhasil keluar dari channel");
        onOpenChange(false);
        router.push("/channels");
        router.refresh();
      } else {
        toast.error(response.error?.message || "Gagal keluar channel");
      }
    } finally {
      setIsLeaving(false);
    }
  };

  const handleKickMember = async (userId: string, username: string) => {
    try {
      const response = await removeParticipant(roomData.id, userId, currentUserId);
      if (response.status === "success") {
        toast.success(`${username} berhasil dikeluarkan`);
        router.refresh();
      } else {
        toast.error(response.error?.message || "Gagal mengeluarkan member");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan");
    }
  };

  const isBannerUrl = banner && (banner.startsWith("http") || banner.startsWith("/"));

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
      <DialogContent className="overflow-hidden p-0 h-[85dvh] w-[calc(100%-2rem)] sm:w-full sm:max-w-[550px] md:h-[750px] md:max-h-[85vh] gap-0 border-0 shadow-2xl flex flex-col [&>button:last-child]:hidden">
        <div
          className="relative h-32 border-b bg-zinc-900 shadow-inner group/banner transition-all"
          style={{
            background: (() => {
              const displayBanner = isDirect ? otherUser?.banner : banner;
              const isUrl = displayBanner && (displayBanner.startsWith("http") || displayBanner.startsWith("/"));
              return isUrl
                ? `url(${displayBanner}) center/cover no-repeat`
                : (displayBanner || "#18181b");
            })()
          }}
        >
          {isOwner && !isDirect && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 text-xs font-bold"
                onClick={() => bannerInputRef.current?.click()}
                disabled={isBannerUploading}
              >
                {isBannerUploading ? <CircleNotch weight="duotone" className="w-3 h-3 animate-spin mr-1" /> : <Camera className="w-3 h-3 mr-1" />}
                Ubah Banner
              </Button>
              {banner && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0"
                  onClick={() => setBanner("")}
                >
                  <X weight="duotone" className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
          <input
            type="file"
            ref={bannerInputRef}
            onChange={handleBannerUpload}
            className="hidden"
            accept="image/*"
          />

          <div className="absolute -bottom-10 left-6 group">
            {isLoading ? (
              <Skeleton className="h-20 w-20 rounded-2xl ring-4 ring-background shadow-xl" />
            ) : (
              <div className="relative">
                <div
                  className="cursor-pointer ring-4 ring-background rounded-2xl overflow-hidden shadow-xl"
                  onClick={() => setIsLightboxOpen(true)}
                >
                  <UserAvatar
                    src={currentAvatarSrc}
                    alt={currentAvatarName}
                    className="h-20 w-20 rounded-2xl text-2xl hover:scale-105 transition-transform duration-300"
                  />
                </div>
                {isOwner && !isDirect && (
                  <button
                    onClick={handleAvatarClick}
                    className="absolute -bottom-2 -right-2 z-10 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg hover:bg-primary/90 transition-transform active:scale-95"
                    title="Ubah Foto Channel"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        <div className="pt-12 px-4 sm:px-6 pb-4 flex-1 flex flex-col min-h-0">
          {/* Banner Presets */}
          {isOwner && !isDirect && (
            <div className="mb-4 flex flex-wrap gap-1.5 justify-end">
              {bannerPresets.map((p) => (
                <button
                  key={p}
                  onClick={() => setBanner(p)}
                  className={cn(
                    "h-4 w-7 rounded-sm border transition-all hover:scale-110",
                    banner === p ? "ring-2 ring-primary ring-offset-1" : "border-transparent"
                  )}
                  style={{ background: p }}
                />
              ))}
            </div>
          )}

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
                        className="text-[10px] font-bold py-0 px-1.5"
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
                        <Users weight="duotone" className="w-3.5 h-3.5" />{" "}
                        {roomData.participants.length} Anggota
                      </>
                    )}
                  </p>
                </>
              )}
            </div>
          </div>

          <Tabs defaultValue="overview" className="mt-6 flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="gap-2 text-xs sm:text-sm">
                <Info weight="duotone" className="w-3.5 h-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="members" className="gap-2 text-xs sm:text-sm">
                <Users weight="duotone" className="w-3.5 h-3.5" /> Members
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="gap-2 text-xs sm:text-sm"
                disabled={!isOwner && !isDirect}
              >
                <Gear className="w-3.5 h-3.5" /> Settings
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4 -mx-1 px-1">
              <div className="pb-32">
                <TabsContent value="overview" className="mt-0 space-y-6">
                  <section className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground px-1">
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
                      <h3 className="text-xs font-bold text-muted-foreground px-1">
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
                              className="h-8 w-8 rounded-md"
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
                    <h3 className="text-xs font-bold text-muted-foreground px-1">
                      Informasi
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/30 rounded-lg p-3 flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground font-bold">
                          Dibuat
                        </span>
                        <span className="text-sm flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          {isLoading ? (
                            <Skeleton className="h-4 w-20" />
                          ) : (
                            new Date(isDirect ? (otherUser?.createdAt || roomData.createdAt) : roomData.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          )}
                        </span>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground font-bold">
                          ID
                        </span>
                        <span className="text-sm truncate">
                          {roomData.id.split("-")[0]}...
                        </span>
                      </div>
                    </div>
                  </section>

                  {!isOwner && !isDirect && !isGeneral && (
                    <section className="pt-4 border-t">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive gap-2 border-destructive/20 font-bold">
                            <SignOut weight="duotone" className="w-4 h-4" /> Keluar dari Channel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Keluar dari #{roomData.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Anda akan kehilangan akses ke channel ini dan harus diundang kembali atau bergabung secara manual jika channel ini publik.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleLeaveRoom}
                              disabled={isLeaving}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {isLeaving ? <CircleNotch weight="duotone" className="w-4 h-4 animate-spin mr-2" /> : null}
                              Ya, Keluar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </section>
                  )}
                </TabsContent>

                <TabsContent value="members" className="mt-0 space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold text-muted-foreground">
                        Anggota — {roomData.participants.length}
                      </h3>
                    </div>

                    <div className="grid gap-2">
                      {roomData.participants.sort((a, b) => {
                        if (a.user.id === roomData.ownerId) return -1;
                        if (b.user.id === roomData.ownerId) return 1;
                        return 0;
                      }).map((participant) => {
                        const isCurrentUser = participant.user.id === currentUserId;
                        const isParticipantOwner = participant.user.id === roomData.ownerId;

                        return (
                          <div key={participant.user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <UserAvatar src={participant.user.avatar} className="h-10 w-10 rounded-lg shadow-sm" />
                                {/* {isParticipantOwner && (
                                  <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 border-2 border-background shadow-xs">
                                    <Shield className="w-2 h-2" />
                                  </div>
                                )} */}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold flex items-center gap-1.5 leading-none">
                                  {participant.user.username}
                                  {isCurrentUser && <span className="text-[10px] text-muted-foreground font-medium">(Anda)</span>}
                                  {isParticipantOwner && (
                                    <Crown className="w-3 h-3 text-amber-500" />
                                  )}
                                </span>
                                <span className="text-[10px] text-muted-foreground mt-1">
                                  {isParticipantOwner ? 'Pemilik Channel' : 'Member'}
                                </span>
                              </div>
                            </div>

                            {isOwner && !isParticipantOwner && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                    <UserMinus weight="duotone" className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Keluarkan {participant.user.username}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      User ini akan dikeluarkan dari channel #{roomData.name}.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleKickMember(participant.user.id, participant.user.username)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Ya, Keluarkan
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="mt-0 space-y-5">
                  {isOwner && !isDirect ? (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="channel-name">Nama Channel</Label>
                        <div className="relative">
                          <Hash weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                            <Globe weight="duotone" className="w-4 h-4 text-emerald-500" />
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
                            <Warning weight="duotone" className="w-4 h-4" />
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
                                  <CircleNotch weight="duotone" className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash weight="duotone" className="w-4 h-4" />
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
                    </>
                  ) : isDirect ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Profil pengguna dan pengaturan DM akan segera hadir di sini.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Anda tidak memiliki izin untuk mengubah pengaturan channel ini.
                    </p>
                  )}
                </TabsContent>
              </div>
            </ScrollArea>

            {isOwner && !isDirect && isDirty && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-zinc-900/95 backdrop-blur-md text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-8 duration-300 z-50 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="hidden xs:flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                    <Sparkle weight="duotone" className="h-4 w-4" />
                  </div>
                  <span className="text-[12px] sm:text-sm font-medium">Ada perubahan!</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setName(roomData.name);
                      setDescription(roomData.description || "");
                      setIsPublic(roomData.isPublic);
                      setBanner(roomData.banner || "");
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    className="text-white hover:bg-white/10 h-8 font-bold transition-colors text-xs"
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-8 font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95 text-xs"
                  >
                    {isSaving ? <CircleNotch weight="duotone" className="h-3 w-3 animate-spin mr-1.5" /> : null}
                    Simpan
                  </Button>
                </div>
              </div>
            )}
          </Tabs>
        </div>
      </DialogContent>
      <ImageLightbox
        images={[{
          url: currentAvatarSrc,
          filename: `Avatar ${currentAvatarName}`
        }]}
        open={isLightboxOpen}
        onOpenChange={setIsLightboxOpen}
      />
    </Dialog>
  );
}
