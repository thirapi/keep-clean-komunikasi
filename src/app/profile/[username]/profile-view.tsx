"use client";

import React, { useState, useMemo } from "react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import {
    MessageSquare,
    Sparkles,
    ArrowLeft,
    Share2,
    Info,
    UserPen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createRoom } from "../../(with-sidebar)/channels/[roomId]/room.action";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UserSettingsDialog } from "../../(with-sidebar)/user-settings-dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface ProfileViewProps {
    user: {
        id: string;
        username: string;
        avatar: string;
        bio?: string | null;
        banner?: string | null;
        customStatus?: string | null;
        roles: { id: string; name: string }[];
        createdAt: string | Date;
    };
    currentUser: {
        id: string;
        name: string;
        initial: string;
        role: string;
        email: string;
        avatar: string;
        bio?: string | null;
        banner?: string | null;
        customStatus?: string | null;
    } | null;
}

export default function ProfileView({ user, currentUser }: ProfileViewProps) {
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [activeTab, setActiveTab] = useState("Threads");
    const isOwnProfile = currentUser?.id === user.id;

    const handleStartDM = async () => {
        if (!currentUser) {
            toast.error("Anda harus login untuk mengirim pesan");
            return;
        }

        setIsRedirecting(true);
        try {
            const response = await createRoom(currentUser.id, user.id);
            if (response.status === "success" && response.data) {
                router.push(`/channels/${response.data.id}`);
            } else {
                toast.error(response.error?.message || "Gagal membuat percakapan");
            }
        } finally {
            setIsRedirecting(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link profil disalin!");
    };

    const isBannerUrl = user.banner && (user.banner.startsWith("http") || user.banner.startsWith("/"));

    const formattedJoinDate = useMemo(() => {
        try {
            const date = new Date(user.createdAt);
            if (isNaN(date.getTime())) return "Januari 2025";
            return date.toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric"
            });
        } catch (e) {
            return "Januari 2025";
        }
    }, [user.createdAt]);

    const tabs = ["Threads", "Replies", "Media", "Reposts"];

    return (
        <div className="flex flex-col h-[100dvh] bg-background animate-in fade-in duration-500 overflow-hidden">
            <div className="max-w-4xl mx-auto w-full h-full flex flex-col px-4 sm:px-6 lg:px-8">
                {/* Header Navigation - Compact */}
                <div className="flex items-center justify-between py-4 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="rounded-full hover:bg-muted"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <span className="font-bold text-lg text-foreground/90">{user.username}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {isOwnProfile ? (
                            <UserSettingsDialog
                                user={currentUser as any}
                                trigger={
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full hover:bg-muted"
                                        title="Edit Profil"
                                    >
                                        <UserPen className="h-4 w-4" />
                                    </Button>
                                }
                            />
                        ) : (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleStartDM}
                                disabled={isRedirecting}
                                className="rounded-full hover:bg-muted text-primary"
                                title="Kirim Pesan"
                            >
                                <MessageSquare className="h-4 w-4" />
                            </Button>
                        )}

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full hover:bg-muted"
                                    title="Informasi Profil"
                                >
                                    <Info className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0 bg-card border-white/10 shadow-2xl rounded-xl overflow-hidden" align="end" sideOffset={10}>
                                <div className="p-5 relative">
                                    <div className="absolute top-5 right-5">
                                        <UserAvatar src={user.avatar} className="h-10 w-10 rounded-full ring-1 ring-white/10" />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-zinc-500">Name</p>
                                            <p className="text-sm font-bold text-white">{user.username} (@{user.username})</p>
                                        </div>
                                        <Separator className="bg-white/5" />
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-zinc-500">Joined</p>
                                            <p className="text-sm font-bold text-white">{formattedJoinDate}</p>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopyLink}
                            className="rounded-full hover:bg-muted"
                            title="Salin Link"
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Main Profile Card - Balanced Sizes */}
                <div className="bg-zinc-950 rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10 border-0 flex flex-col flex-1 mb-6">
                    {/* Banner */}
                    <div
                        className="h-32 sm:h-44 w-full bg-muted relative flex-shrink-0"
                        style={{
                            background: isBannerUrl ? `url(${user.banner}) center/cover no-repeat` : (user.banner || "#18181b"),
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>

                    <div className="relative px-8 sm:px-12 pt-14 sm:pt-20 pb-6 flex-shrink-0">
                        {/* Overlapping Avatar */}
                        <div className="absolute -top-12 sm:-top-16 left-8 sm:left-12">
                            <div className="p-1 bgColor-zinc-950 bg-zinc-950 rounded-2xl ring-1 ring-white/10 shadow-2xl">
                                <UserAvatar
                                    src={user.avatar}
                                    className="h-24 w-24 sm:h-32 sm:w-32 rounded-xl"
                                />
                                <div className="absolute bottom-3 right-3 h-5 w-5 sm:h-7 sm:w-7 bg-emerald-500 rounded-full border-4 border-zinc-950 shadow-lg" />
                            </div>
                        </div>

                        {/* Info with Balanced Typography */}
                        <div className="space-y-5">
                            <div className="flex flex-col">
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                                    {user.username}
                                </h1>
                                {user.customStatus && (
                                    <div className="flex items-center gap-1.5 mt-1.5 opacity-80">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        <p className="text-sm text-zinc-300 leading-none truncate">{user.customStatus}</p>
                                    </div>
                                )}
                            </div>

                            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed italic max-w-2xl font-medium">
                                {user.bio || "Tidak ada biografi untuk pengguna ini."}
                            </p>
                        </div>
                    </div>

                    {/* Feed Tabs Section */}
                    <div className="flex flex-col flex-1 min-h-0 border-t border-white/5">
                        {/* Tab Bar - Justified Width */}
                        <div className="flex w-full border-b border-white/5">
                            {tabs.map((tab) => (
                                <div
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "flex-1 py-4 text-sm font-bold transition-all relative cursor-pointer text-center",
                                        activeTab === tab ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full mx-6" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-30 select-none overflow-y-auto">
                            <div className="flex flex-col items-center gap-2 text-center animate-in fade-in zoom-in-95 duration-500" key={activeTab}>
                                <span className="text-base font-medium text-zinc-400">
                                    No {activeTab.toLowerCase()} yet.
                                </span>
                                <span className="text-[10px] tracking-[0.2em] text-zinc-600 font-bold">Coming Soon</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
