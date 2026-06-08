"use client";

import * as React from "react";
import { Bell, Check, PencilSimple, Lock, Shield, User, UserCircle, X, CircleNotch, Camera, Key, Sparkle, CaretLeft, Globe, Plugs, Trash, Fingerprint, UserSwitch, Info, WarningCircle } from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
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
} from "@/components/ui/alert-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { updateUserAction, changePasswordAction } from "./user.action";
import { uploadFileAction } from "./channels/[roomId]/messages.action";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const data = {
  nav: [
    { name: "Profil", icon: User },
    { name: "Keamanan", icon: Shield },
    { name: "Fediverse", icon: Globe },
    { name: "Tampilan", icon: Paintbrush },
  ],
};

function Paintbrush(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m14.622 17.897-3.458-3.458 3.458-3.458 3.458 3.458Z" />
      <path d="M18.396 15.642 20 17.246a1 1 0 0 1 0 1.414l-1.417 1.417a1 1 0 0 1-1.414 0l-1.604-1.604" />
      <path d="M8 11.414 3.414 6.828a2 2 0 0 1 0-2.828l1.414-1.414a2 2 0 0 1 2.828 0L12.242 7.172" />
      <path d="m2 21 5-5" />
      <path d="M5 11h2" />
      <path d="M11 5v2" />
      <path d="M13 13h2" />
      <path d="M11 11v2" />
    </svg>
  )
}

const presetBanners = [
  "linear-gradient(to right, #4f46e5, #7c3aed)",
  "linear-gradient(to right, #06b6d4, #3b82f6)",
  "linear-gradient(to right, #10b981, #3b82f6)",
  "linear-gradient(to right, #f59e0b, #ef4444)",
  "#1e293b",
  "#475569",
];

export function UserSettingsDialog({
  user,
  trigger,
}: {
  user: {
    id: string;
    name: string;
    username: string;
    initial: string;
    role: string;
    email: string;
    avatar: string;
    bio?: string | null;
    banner?: string | null;
    customStatus?: string | null;
    alsoKnownAs?: string[] | null;
    movedTo?: string | null;
  };
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<string | null>("Profil");
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [username, setUsername] = React.useState(user.username);
  const [displayName, setDisplayName] = React.useState(user.name);
  const [avatar, setAvatar] = React.useState(user.avatar);
  const [bio, setBio] = React.useState(user.bio || "");
  const [banner, setBanner] = React.useState(user.banner || "");
  const [customStatus, setCustomStatus] = React.useState(user.customStatus || "");

  // Fediverse states
  const [alsoKnownAs, setAlsoKnownAs] = React.useState<string[]>(user.alsoKnownAs || []);
  const [movedTo, setMovedTo] = React.useState(user.movedTo || "");
  const [newAlias, setNewAlias] = React.useState("");
  const [isAddingAlias, setIsAddingAlias] = React.useState(false);
  const [showMigrationConfirm, setShowMigrationConfirm] = React.useState(false);

  const [isUploading, setIsUploading] = React.useState(false);
  const [isBannerUploading, setIsBannerUploading] = React.useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);

  // Password fields
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpdateProfile = async () => {
    if (!username.trim()) return toast.error("Handle tidak boleh kosong");
    setIsUpdating(true);
    try {
      const response = await updateUserAction(user.id, {
        username: username.trim(),
        name: displayName.trim() || null,
        avatar: avatar,
        bio: bio.trim() || null,
        banner: banner || null,
        customStatus: customStatus.trim() || null,
        alsoKnownAs: alsoKnownAs,
        movedTo: movedTo.trim() || null,
      });

      if (response.status === "success") {
        toast.success("Profil berhasil diperbarui!");
      } else {
        toast.error(`Gagal memperbarui profil: ${response.error?.message}`);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) return toast.error("Password baru tidak boleh kosong");
    if (newPassword !== confirmPassword) return toast.error("Konfirmasi password tidak cocok");

    setIsUpdating(true);
    try {
      const response = await changePasswordAction(user.id, {
        oldPassword,
        newPassword,
      });

      if (response.status === "success") {
        toast.success("Password berhasil diubah!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(response.error?.message || "Gagal mengubah password");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await uploadFileAction(formData, "avatars");

      if (response.status === "success" && response.data) {
        setAvatar(response.data.fileurl);
        toast.success("Foto profil berhasil diunggah!");
      } else {
        toast.error(response.error?.message || "Gagal mengunggah foto");
      }
    } finally {
      setIsUploading(false);
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
      const response = await uploadFileAction(formData, "banners");

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

  const isBannerUrl = banner && (banner.startsWith("http") || banner.startsWith("/"));
  const isDirty =
    username !== user.username ||
    displayName !== user.name ||
    avatar !== user.avatar ||
    bio !== (user.bio || "") ||
    banner !== (user.banner || "") ||
    customStatus !== (user.customStatus || "") ||
    JSON.stringify(alsoKnownAs) !== JSON.stringify(user.alsoKnownAs || []) ||
    movedTo !== (user.movedTo || "");

  const handleReset = () => {
    setUsername(user.username);
    setDisplayName(user.name);
    setAvatar(user.avatar);
    setBio(user.bio || "");
    setBanner(user.banner || "");
    setCustomStatus(user.customStatus || "");
    setAlsoKnownAs(user.alsoKnownAs || []);
    setMovedTo(user.movedTo || "");
  };

  const handleAddAlias = async () => {
    const alias = newAlias.trim();
    if (!alias) return;
    if (!alias.startsWith("http")) return toast.error("Masukkan alamat profil lengkap (mulai dengan https://)");
    if (alsoKnownAs.includes(alias)) return toast.error("Akun ini sudah terdaftar sebagai alias");

    setIsAddingAlias(true);
    // Simulate validation handshake
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setAlsoKnownAs([...alsoKnownAs, alias]);
    setNewAlias("");
    setIsAddingAlias(false);
    toast.success("Akun berhasil ditambahkan sebagai alias");
  };

  const handleRemoveAlias = (alias: string) => {
    setAlsoKnownAs(alsoKnownAs.filter((a) => a !== alias));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted/50 rounded-md transition-colors">
            <UserCircle className="h-4 w-4 text-muted-foreground" />
            Edit Profile
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 h-[100dvh] w-full md:h-full md:max-h-[800px] md:max-w-[900px] lg:max-w-[1050px] gap-0 border-0 shadow-2xl">
        <SidebarProvider className="items-start min-h-0 h-full">
          <Sidebar collapsible="none" className={cn("hidden md:flex w-52 border-r bg-muted/20", selectedItem && "hidden md:flex")}>
            <SidebarContent className="p-2">
              <div className="px-3 py-4">
                <h2 className="text-sm font-bold text-muted-foreground/70">
                  Pengaturan
                </h2>
              </div>
              <SidebarMenu>
                {data.nav.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      isActive={selectedItem === item.name}
                      onClick={() => setSelectedItem(item.name)}
                      className={cn(
                        "w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-all",
                        selectedItem === item.name
                          ? "bg-primary/10 text-primary font-bold shadow-sm"
                          : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>

          <main className="flex flex-1 flex-col min-h-0 bg-background h-full relative">
            <div className="flex items-center justify-between p-4 md:p-6 pb-2 border-b md:border-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedItem(null)}
                  className={cn("md:hidden h-8 w-8", !selectedItem && "invisible")}
                >
                  <CaretLeft weight="duotone" className="h-5 w-5" />
                </Button>
                <div>
                  <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight">
                    {selectedItem || "Pengaturan"}
                  </DialogTitle>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 md:p-6 pt-2 pb-24 md:pb-32">
                {selectedItem === "Profil" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                    {/* LEFT COLUMN: EDIT FORM */}
                    <div className="lg:col-span-7 space-y-6">
                      {/* Integrated Header: Banner & Avatar */}
                      <div className="relative mb-14">
                        <Label className="text-sm font-bold mb-3 block">Visual Profil</Label>
                        <div className="relative group/banner h-32 rounded-xl overflow-hidden border border-border bg-muted/20 shadow-inner">
                          <div
                            className="w-full h-full"
                            style={{
                              background: isBannerUrl ? `url(${banner}) center/cover no-repeat` : banner,
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
                          </div>
                          <input
                            type="file"
                            ref={bannerInputRef}
                            onChange={handleBannerUpload}
                            className="hidden"
                            accept="image/*"
                          />
                        </div>

                        {/* Overlapping Avatar */}
                        <div className="absolute -bottom-10 left-4 flex items-end gap-4">
                          <div className="relative group/avatar shrink-0">
                            <div
                              className="cursor-pointer rounded-2xl overflow-hidden border-4 border-background shadow-lg"
                              onClick={() => setIsLightboxOpen(true)}
                            >
                              <UserAvatar
                                src={avatar}
                                className="h-20 w-20 rounded-xl"
                              />
                            </div>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center rounded-xl transition-opacity"
                              title="Ubah Foto Profil"
                            >
                              {isUploading ? <CircleNotch weight="duotone" className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
                            </button>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileUpload}
                              className="hidden"
                              accept="image/*"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Color Presets - Moved below banner/avatar */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        <div className="relative h-6 w-6 rounded-md overflow-hidden border border-border cursor-pointer ring-offset-background focus-within:ring-2 ring-primary">
                          <input
                            type="color"
                            className="absolute -top-1 -left-1 h-8 w-8 cursor-pointer"
                            onChange={(e) => setBanner(e.target.value)}
                            value={!isBannerUrl && !presetBanners.includes(banner) ? banner : "#ffffff"}
                          />
                        </div>
                        {presetBanners.map((p) => (
                          <button
                            key={p}
                            onClick={() => setBanner(p)}
                            className={cn(
                              "h-6 w-10 rounded-md border transition-all hover:scale-105",
                              banner === p ? "ring-2 ring-primary ring-offset-1 scale-105" : "border-border"
                            )}
                            style={{ background: p }}
                          />
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="grid gap-2">
                          <Label htmlFor="displayName" className="text-sm font-bold">Nama Tampilan</Label>
                          <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="h-10 bg-muted/20 focus:bg-background transition-colors"
                            placeholder="Masukkan nama tampilan"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="username" className="text-sm font-bold">Handle</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">@</span>
                            <Input
                              id="username"
                              value={username}
                              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                              className="h-10 pl-7 font-medium bg-muted/20 focus:bg-background transition-colors"
                              placeholder="username"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Handle Warning - More compact */}
                      <div className="px-4 py-3 rounded-lg bg-accent/50 border border-border flex items-center gap-3">
                        <WarningCircle weight="duotone" className="w-4 h-4 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground leading-tight">
                          Mengubah handle akan mengubah alamat profil Anda di seluruh jaringan.
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="status" className="text-sm font-bold flex items-center gap-2">
                          Status Kustom <Sparkle weight="duotone" className="w-3.5 h-3.5 text-primary" />
                        </Label>
                        <Input
                          id="status"
                          value={customStatus}
                          onChange={(e) => setCustomStatus(e.target.value)}
                          className="h-10 bg-muted/20 focus:bg-background transition-colors"
                          placeholder="Apa yang sedang terjadi?"
                          maxLength={100}
                        />
                      </div>

                      <div className="grid gap-2">
                        <div className="flex justify-between items-end">
                          <Label htmlFor="bio" className="text-sm font-bold">Bio</Label>
                          <p className="text-[10px] text-muted-foreground">{bio.length}/250</p>
                        </div>
                        <textarea
                          id="bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="flex min-h-[80px] w-full rounded-lg border border-input bg-muted/20 focus:bg-background px-3 py-2 text-sm focus-visible:outline-none focus:ring-1 focus:ring-primary resize-none transition-colors"
                          placeholder="Ceritakan tentang diri Anda..."
                          maxLength={250}
                        />
                      </div>
                    </div>

                    {/* RIGHT COLUMN: PREVIEW */}
                    <div className="hidden lg:col-span-5 lg:flex flex-col">
                      <div className="sticky top-0">
                        <Label className="text-sm font-bold mb-3 block">Pratinjau Profil</Label>
                        <div className="w-full max-w-[300px] mx-auto rounded-2xl overflow-hidden bg-card border border-border shadow-xl animate-in zoom-in-95 duration-500">
                          {/* Mini Banner */}
                          <div
                            className="h-24 w-full bg-muted relative"
                            style={{
                              background: isBannerUrl ? `url(${banner}) center/cover no-repeat` : banner || "var(--muted)",
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                          </div>

                          <div className="relative px-4 pb-6 pt-10">
                            {/* Overlapping Avatar */}
                            <div className="absolute -top-12 left-3">
                              <div className="p-1 bg-card rounded-xl ring-1 ring-border shadow-xl">
                                <UserAvatar src={avatar} className="h-20 w-20 rounded-lg" />
                                <div className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full border-2 border-card bg-emerald-500 shadow-sm" />
                              </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-4">
                              <div className="flex flex-col">
                                <h3 className="text-lg font-bold text-foreground tracking-tight leading-tight truncate">
                                  {displayName || username || user.username}
                                </h3>
                                <p className="text-xs text-muted-foreground font-mono">@{username || user.username}</p>
                                {customStatus && (
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <Sparkle weight="duotone" className="w-3.5 h-3.5 text-primary" />
                                    <p className="text-xs text-muted-foreground leading-none truncate">{customStatus}</p>
                                  </div>
                                )}
                              </div>

                              <p className="text-sm text-muted-foreground leading-relaxed italic line-clamp-4">
                                {bio || "Belum ada biografi..."}
                              </p>

                              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled
                                  className="w-full h-9 text-xs font-bold"
                                >
                                  Lihat Profil
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )  }

                {selectedItem === "Fediverse" && (
                  <div className="animate-in fade-in duration-300 space-y-8">
                    <div className="p-5 rounded-xl border border-border bg-muted/30 flex gap-4">
                      <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <Globe className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Identitas Terdistribusi</p>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          Kelola bagaimana Anda dikenali di seluruh jaringan Fediverse. Anda dapat menghubungkan identitas dari server lain atau memindahkan akun Anda.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Alias Section */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Fingerprint weight="duotone" className="w-5 h-5 text-primary" />
                          <Label className="text-base font-bold">Hubungkan Akun Lain</Label>
                        </div>
                        
                        <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-border space-y-3">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Apakah Anda memiliki akun di server lain (misal: Mastodon)? Tambahkan alamat profilnya di sini untuk memverifikasi bahwa akun tersebut adalah milik Anda yang sama.
                          </p>
                          <div className="flex gap-2">
                            <Input
                              value={newAlias}
                              onChange={(e) => setNewAlias(e.target.value)}
                              placeholder="https://mastodon.social/@username"
                              className="h-10 bg-background"
                              disabled={isAddingAlias}
                              onKeyDown={(e) => e.key === "Enter" && handleAddAlias()}
                            />
                            <Button 
                              size="sm" 
                              onClick={handleAddAlias} 
                              className="h-10 min-w-[80px]"
                              disabled={isAddingAlias || !newAlias}
                            >
                              {isAddingAlias ? <CircleNotch className="w-3 h-3 animate-spin" /> : "Hubungkan"}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {alsoKnownAs.map((alias) => (
                            <div key={alias} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border group animate-in slide-in-from-top-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                <span className="text-xs font-medium truncate text-muted-foreground">{alias}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-all"
                                onClick={() => handleRemoveAlias(alias)}
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          {alsoKnownAs.length === 0 && (
                            <div className="py-8 text-center border border-dashed border-border rounded-xl">
                              <p className="text-[11px] text-muted-foreground italic">Belum ada akun lain yang terhubung.</p>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Migration Section */}
                      <section className="space-y-4 pt-6 border-t border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <UserSwitch weight="duotone" className="w-5 h-5 text-primary" />
                          <Label className="text-base font-bold">Pindah ke Akun Lain</Label>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                          <div className="flex gap-3">
                            <Info weight="duotone" className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Gunakan fitur ini jika Anda ingin <strong>berhenti menggunakan akun ini</strong> dan memindahkan pengikut Anda ke akun di server lain secara permanen.
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="grid gap-1.5">
                              <p className="text-sm font-bold text-muted-foreground">Alamat Akun Baru</p>
                              <Input
                                id="movedTo"
                                value={movedTo}
                                onChange={(e) => setMovedTo(e.target.value)}
                                placeholder="https://server-baru.com/@username"
                                className="h-10 bg-background"
                              />
                            </div>
                            
                            {movedTo && (
                              <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/50 border border-border animate-in zoom-in-95">
                                <WarningCircle weight="fill" className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <p className="text-[10px] text-muted-foreground leading-normal">
                                  Menyimpan perubahan ini akan mengaktifkan pengalihan otomatis. Follower Anda akan melihat pengumuman bahwa Anda telah pindah.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </section>
                    </div>
                    
                    {/* Migration Confirmation Dialog */}
                    <AlertDialog open={showMigrationConfirm} onOpenChange={setShowMigrationConfirm}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Konfirmasi Perpindahan Akun</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm text-muted-foreground">
                            Anda akan mengatur pengalihan akun ke <span className="font-mono text-primary">{movedTo}</span>. 
                            Aksi ini akan memberitahu seluruh follower Anda di Fediverse.
                            <br /><br />
                            Apakah Anda yakin ingin melanjutkan?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => {
                              setShowMigrationConfirm(false);
                              handleUpdateProfile();
                            }}
                            className="bg-primary text-primary-foreground"
                          >
                            Ya, Aktifkan Pengalihan
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

                {selectedItem === "Keamanan" && (
                  <div className="animate-in fade-in duration-300 space-y-8">
                    <div className="p-5 rounded-xl border border-border bg-muted/30 flex gap-4">
                      <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <Shield className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Keamanan Akun</p>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          Gunakan kata sandi yang kuat dan unik untuk melindungi akun Anda dari akses yang tidak sah. Minimal 8 karakter dengan kombinasi angka dan simbol.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid gap-2">
                        <Label className="text-sm font-bold">Kata Sandi Saat Ini</Label>
                        <Input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="bg-muted/20 h-10 border-border focus:bg-background transition-colors"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm font-bold">Kata Sandi Baru</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-muted/20 h-10 border-border focus:bg-background transition-colors"
                          placeholder="Minimal 8 karakter"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm font-bold">Konfirmasi Kata Sandi Baru</Label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-muted/20 h-10 border-border focus:bg-background transition-colors"
                          placeholder="Ulangi kata sandi baru"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end w-full sm:w-auto">
                      <Button
                        variant="default"
                        onClick={handleChangePassword}
                        disabled={isUpdating || !newPassword}
                        className="w-full sm:w-auto sm:px-10 font-bold h-11 shadow-lg"
                      >
                        {isUpdating ? <CircleNotch weight="duotone" className="mr-2 h-4 w-4 animate-spin" /> : <><Key className="mr-2 h-4 w-4" /> Perbarui Kata Sandi</>}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedItem === "Tampilan" && (
                  <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center animate-in fade-in duration-300">
                    <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center mb-2">
                      <Paintbrush className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold tracking-tight">Tema & Kustomisasi</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        Kami sedang menyiapkan fitur untuk mengubah tema kustom dan warna aksen agar aplikasi terasa lebih personal.
                      </p>
                    </div>
                    <Button variant="secondary" className="px-8 font-bold" disabled>
                      Coming Soon
                    </Button>
                  </div>
                )}

                {/* Mobile Navigation List (Visible when selectedItem is null) */}
                {!selectedItem && (
                  <div className="md:hidden animate-in slide-in-from-left-4 duration-300">
                    {data.nav.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => setSelectedItem(item.name)}
                        className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5 text-muted-foreground" />
                          <span className="font-bold">{item.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            {selectedItem === "Profil" && isDirty && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] max-w-2xl bg-card/95 backdrop-blur-md text-card-foreground px-3 sm:px-4 py-3 rounded-xl flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-8 duration-300 z-50 border border-border">
                <div className="flex items-center gap-2 sm:gap-3 mr-2">
                  <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-accent text-primary">
                    <Sparkle weight="duotone" className="h-4 w-4" />
                  </div>
                  <span className="text-[12px] sm:text-sm font-medium leading-tight text-foreground">
                    <span className="hidden xs:inline">Hati-hati — ada </span>perubahan belum disimpan!
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="hover:bg-accent h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm font-bold transition-colors"
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (movedTo !== (user.movedTo || "")) {
                        setShowMigrationConfirm(true);
                      } else {
                        handleUpdateProfile();
                      }
                    }}
                    disabled={isUpdating}
                    className="bg-primary text-primary-foreground border-0 h-8 sm:h-9 px-3 sm:px-6 text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95"
                  >
                    {isUpdating ? <CircleNotch weight="duotone" className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1.5 sm:mr-2" /> : null}
                    <span className="hidden sm:inline">Simpan Perubahan</span>
                    <span className="sm:hidden">Simpan</span>
                  </Button>
                </div>
              </div>
            )}
          </main>
        </SidebarProvider>
      </DialogContent>
      <ImageLightbox
        images={[{
          url: avatar,
          filename: `Avatar ${user.name}`
        }]}
        open={isLightboxOpen}
        onOpenChange={setIsLightboxOpen}
      />
    </Dialog>
  );
}
