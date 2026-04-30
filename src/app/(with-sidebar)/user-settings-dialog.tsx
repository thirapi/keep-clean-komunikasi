"use client";

import * as React from "react";
import {
  Bell,
  Calendar,
  Check,
  Edit3,
  Globe,
  Home,
  Keyboard,
  Link,
  Lock,
  Mail,
  Menu,
  MessageCircle,
  Paintbrush,
  Settings,
  Shield,
  User,
  UserCircle,
  UserPen,
  Video,
  X,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { CurrentAvatar } from "./current-avatar";
import { updateUserAction } from "./user.action";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/ui/user-avatar";

const data = {
  nav: [
    { name: "Account Info", icon: Settings },
    { name: "Change Avatar", icon: UserCircle },
  ],
};

const presetAvatars = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
  "/avatars/avatar3.png",
  "/avatars/avatar4.png",
  // "/avatars/avatar5.png",
  // "/avatars/avatar6.png",
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
  const [selectedItem, setSelectedItem] = React.useState("Account Info");
  const [selectedAvatar, setSelectedAvatar] = React.useState<string | null>(
    null
  );

  const handleAvatarSelect = (src: string) => {
    setSelectedAvatar(src);
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatar) return toast("Pilih avatar terlebih dahulu!");

    try {
      const response = await updateUserAction(user.id, {
        avatar: selectedAvatar,
      });

      if (response.status === "success") {
        console.log("Avatar berhasil disimpan:", selectedAvatar);
        toast("Avatar berhasil diperbarui!");
        // Opsional: update state/context user di frontend jika perlu
        // setUser((prev) => ({ ...prev, avatar: selectedAvatar }));
      } else {
        toast(`Gagal memperbarui avatar: ${response.error?.message}`);
      }
    } catch (err) {
      console.error(err);
      toast("Terjadi kesalahan saat memperbarui avatar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted/50">
          <UserPen className="h-4 w-4" />
          Edit Profile
        </button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your settings here.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild>
                          <button
                            onClick={() => setSelectedItem(item.name)}
                            className="flex items-center gap-2 w-full"
                          >
                            <item.icon />
                            <span>{item.name}</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Edit Profile</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{selectedItem}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
              {selectedItem === "Change Avatar" && (
                <div className="space-y-4">
                  <CurrentAvatar
                    user={{
                      ...user,
                      avatar: selectedAvatar ?? user.avatar,
                    }}
                  />
                  <h2 className="text-lg font-semibold mb-0.5">
                    Choose Avatar
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Choose one of the avatars below to change your look.
                  </p>
                  <div className="grid grid-cols-4 gap-4">
                    {presetAvatars.map((src, idx) => {
                      const isSelected = selectedAvatar === src;

                      return (
                        <div key={idx} className="relative">
                          {isSelected && (
                            <button
                              onClick={() => setSelectedAvatar(null)}
                              className="absolute top-1 right-1 z-10 bg-white rounded-full p-0.5 hover:bg-gray-100 shadow-md"
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          )}

                          <button
                            onClick={() => handleAvatarSelect(src)}
                            className={`border-2 rounded-lg overflow-hidden w-full aspect-square ${
                              isSelected
                                ? "border-blue-500"
                                : "border-transparent hover:border-gray-300"
                            }`}
                          >
                            <img
                              src={src || "/placeholder.svg"}
                              alt={`Avatar ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    onClick={() => handleSaveAvatar()}
                    variant={"outline"}
                  >
                    Save Avatar
                  </Button>
                </div>
              )}
              {selectedItem === "Account Info" && (
                <div className="flex flex-col h-full">
                  <div className="flex-shrink-0 mb-6">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Account Information
                    </h2>
                    <p className="text-muted-foreground">
                      View and manage your account details below.
                    </p>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="space-y-6 pr-4">
                      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative">
                            <div className="overflow-hidden flex items-center justify-center p-4 bg-card rounded-lg">
                              <UserAvatar 
                                src={user.avatar} 
                                alt={user.name}
                                className="w-16 h-16 rounded-lg ring-4 ring-primary/20"
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-foreground">
                              {user.name}
                            </h3>
                            <p className="text-muted-foreground">{user.role}</p>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 mt-1">
                              Active
                            </span>
                          </div>
                          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
                            <Edit3 className="w-4 h-4 mr-2" />
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-4">
                        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                              <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">
                              Personal Information
                            </h3>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-border/50 last:border-b-0">
                              <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">
                                  Full Name
                                </span>
                              </div>
                              <span className="text-sm text-foreground font-medium">
                                {user.name}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-border/50 last:border-b-0">
                              <div className="flex items-center gap-3">
                                <Shield className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">
                                  User ID
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground font-mono bg-accent px-2 py-1 rounded">
                                {user.id}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                              <Mail className="w-5 h-5 text-green-600 dark:text-green-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">
                              Contact Information
                            </h3>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-3">
                              <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">
                                  Email Address
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-foreground font-medium">
                                  {user.email}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                  Verified
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">
                              Security & Access
                            </h3>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-border/50">
                              <div className="flex items-center gap-3">
                                <Shield className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">
                                  Account Role
                                </span>
                              </div>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 capitalize">
                                {user.role}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">
                                  Last Login
                                </span>
                              </div>
                              <span className="text-sm text-foreground">
                                2 hours ago
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button className="flex-1" disabled={true}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent"
                          disabled={true}
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Change Password
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
