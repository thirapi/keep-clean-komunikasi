"use client";

import * as React from "react";
import {
  Bell,
  Check,
  Edit3,
  Lock,
  Mail,
  Settings,
  Shield,
  User,
  UserCircle,
  UserPen,
  X,
  Loader2,
  Camera,
  Key,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
      strokeWidth="2"
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

const presetAvatars = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
  "/avatars/avatar3.png",
  "/avatars/avatar4.png",
  "/avatars/avatar5.png",
  "/avatars/avatar6.png",
];

export function UserSettingsDialog({
  user,
}: {
  user: {
    id: string;
    name: string;
    initial: string;
    role: string;
    email: string;
    avatar: string;
  };
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState("Profil");
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [username, setUsername] = React.useState(user.name);
  const [avatar, setAvatar] = React.useState(user.avatar);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);

  // Password fields
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpdateProfile = async () => {
    if (!username.trim()) return toast.error("Username tidak boleh kosong");
    setIsUpdating(true);
    try {
      const response = await updateUserAction(user.id, {
        username: username.trim(),
        avatar: avatar,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted/50 rounded-md transition-colors">
          <UserPen className="h-4 w-4 text-muted-foreground" />
          Edit Profile
        </button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 md:max-h-[600px] md:max-w-[750px] lg:max-w-[850px] gap-0">
        <SidebarProvider className="items-start min-h-0">
          <Sidebar collapsible="none" className="hidden md:flex w-52 border-r bg-muted/20">
            <SidebarContent className="p-2">
              <div className="px-3 py-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                  User Settings
                </h2>
              </div>
              <SidebarMenu>
                {data.nav.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      isActive={selectedItem === item.name}
                      onClick={() => setSelectedItem(item.name)}
                      className={cn(
                        "w-full justify-start gap-3 px-3 py-2 rounded-lg transition-all",
                        selectedItem === item.name
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>

          <main className="flex flex-1 flex-col min-h-0">
            <DialogHeader className="p-6 pb-0 sm:text-left">
              <DialogTitle className="text-xl font-bold tracking-tight">{selectedItem}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Kelola informasi akun dan preferensi Anda.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 px-6 py-6">
              <div className="space-y-8 max-w-2xl">
                {selectedItem === "Profil" && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <section className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border bg-muted/10">
                        <div className="relative">
                          <div
                            className="cursor-pointer ring-4 ring-background rounded-2xl overflow-hidden shadow-xl"
                            onClick={() => setIsLightboxOpen(true)}
                          >
                            <UserAvatar
                              src={avatar}
                              className="h-24 w-24 rounded-2xl hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="absolute -bottom-2 -right-2 z-10 flex items-center justify-center bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:bg-primary/90 transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Ubah Foto Profil"
                          >
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept="image/*"
                          />
                        </div>
                        <div className="flex-1 text-center sm:text-left space-y-2">
                          <h3 className="font-bold text-lg">Foto Profil</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Unggah foto kustom atau pilih dari avatar yang tersedia. Maksimal 2MB (JPG, PNG).
                          </p>
                          <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                            {presetAvatars.map((src) => (
                              <button
                                key={src}
                                onClick={() => setAvatar(src)}
                                className={cn(
                                  "h-8 w-8 rounded-md border-2 transition-all hover:scale-110",
                                  avatar === src ? "border-primary scale-110" : "border-transparent"
                                )}
                              >
                                <img src={src} className="h-full w-full rounded-md" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="username" className="text-sm font-bold">Username</Label>
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="bg-muted/30"
                          placeholder="Masukkan username Anda"
                        />
                      </div>
                      <div className="grid gap-2 opacity-60">
                        <Label className="text-sm font-bold">Email Address</Label>
                        <div className="px-3 py-2 rounded-md bg-muted border text-sm font-medium">
                          {user.email}
                        </div>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 italic">
                          <Lock className="h-3 w-3" /> Email tidak dapat diubah secara manual.
                        </p>
                      </div>
                    </section>

                    <div className="pt-4 flex justify-end">
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={isUpdating || (username === user.name && avatar === user.avatar)}
                        className="px-8 font-bold shadow-lg shadow-primary/20"
                      >
                        {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Simpan Perubahan"}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedItem === "Keamanan" && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30 flex gap-3">
                      <Shield className="h-5 w-5 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Keamanan Akun</p>
                        <p className="text-xs text-amber-700/80 dark:text-amber-300/60 leading-relaxed mt-0.5">
                          Gunakan password yang kuat dan unik untuk melindungi akun Anda dari akses yang tidak sah.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="grid gap-2">
                        <Label className="text-sm font-bold">Password Saat Ini</Label>
                        <Input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="bg-muted/30"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm font-bold">Password Baru</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-muted/30"
                          placeholder="Minimal 8 karakter"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm font-bold">Konfirmasi Password</Label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-muted/30"
                          placeholder="Ulangi password baru"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button
                        variant="default"
                        onClick={handleChangePassword}
                        disabled={isUpdating || !newPassword}
                        className="px-8 font-bold"
                      >
                        {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Key className="mr-2 h-4 w-4" /> Ganti Password</>}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedItem === "Tampilan" && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center animate-in fade-in duration-300">
                    <Paintbrush className="h-12 w-12 text-muted-foreground/30" />
                    <div className="space-y-1">
                      <h3 className="font-bold">Tema & Kustomisasi</h3>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        Fitur untuk mengubah tema gelap/terang dan warna aksen akan segera hadir.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
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
