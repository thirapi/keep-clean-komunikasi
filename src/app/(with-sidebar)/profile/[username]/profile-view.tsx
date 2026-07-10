"use client";

import React, { useState, useMemo } from "react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { usePresence } from "@/components/presence-provider";
import { ChatTeardropText, Sparkle, ArrowLeft, Info, Pencil, ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { createRoom } from "../../channels/[roomId]/room.action";
import { toast } from "sonner";
import { UserSettingsDialog } from "../../user-settings-dialog";

interface ProfileViewProps {
    user: {
        id: string;
        username: string;
        displayName?: string;
        avatar: string;
        bio?: string | null;
        banner?: string | null;
        customStatus?: string | null;
        roles: { id: string; name: string }[];
        createdAt: string | Date;
        isOwnProfile?: boolean;
    };
    currentUser: {
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
    } | null;
}

export default function ProfileView({ user, currentUser }: ProfileViewProps) {
    const { toggleSidebar } = useSidebar();
    const { onlineUserIds } = usePresence();
    const isUserOnline = onlineUserIds.includes(user.id);
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);
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

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="flex justify-center flex-1 overflow-hidden">
                <div className="w-full max-w-2xl border-x border-border/50 bg-background/30 flex flex-col h-full relative overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-2 md:px-6 md:py-3 sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center gap-4 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                if (document.referrer.includes(window.location.host) && window.history.length > 2) {
                                    router.back();
                                } else if (currentUser) {
                                    router.push("/channels/default");
                                } else {
                                    router.push("/");
                                }
                            }}
                            className="rounded-full hover:bg-muted"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col flex-1 min-w-0">
                            <h1 className="text-lg font-bold tracking-tight truncate">
                                {user.displayName || user.username}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            {isOwnProfile ? (
                                <UserSettingsDialog
                                    user={currentUser as any}
                                    trigger={
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-xl hover:bg-muted h-9 w-9"
                                            title="Edit Profil"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    }
                                />
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleStartDM}
                                    disabled={isRedirecting}
                                    className="rounded-xl hover:bg-muted text-primary h-9 w-9"
                                    title="Kirim Pesan"
                                >
                                    <ChatTeardropText weight="duotone" className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Scrollable Container */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                        {/* Profile Info Section */}
                        <div className="relative">
                            {/* Banner */}
                            <div
                                className="h-32 sm:h-48 w-full bg-muted relative"
                                style={{
                                    background: isBannerUrl ? `url(${user.banner}) center/cover no-repeat` : (user.banner || "#18181b"),
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>

                            {/* Profile Details */}
                            <div className="px-4 sm:px-6 pb-6 relative">
                                <div className="flex justify-between items-start">
                                    <div className="relative -mt-12 sm:-mt-16">
                                        <div className="p-1 bg-background rounded-2xl ring-4 ring-background shadow-2xl">
                                            <UserAvatar
                                                src={user.avatar}
                                                className="h-24 w-24 sm:h-32 sm:w-32 rounded-xl"
                                            />
                                        </div>
                                        {isUserOnline && (
                                            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 rounded-full border-[3px] border-background shadow-lg" />
                                        )}
                                    </div>

                                    <div className="pt-4 flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleCopyLink}
                                            className="rounded-full border border-border/50"
                                        >
                                            <ShareNetwork className="h-4 w-4" />
                                        </Button>
                                        {!isOwnProfile && currentUser && (
                                            <Button
                                                onClick={handleStartDM}
                                                disabled={isRedirecting}
                                                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 h-9"
                                            >
                                                <ChatTeardropText weight="duotone" className="h-4 w-4 mr-1.5" />
                                                Pesan
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                            {user.displayName || user.username}
                                        </h2>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            @{user.username.toLowerCase()}
                                            {user.customStatus && (
                                                <>
                                                    <span className="text-border">•</span>
                                                    <span className="flex items-center gap-1 text-amber-500/80">
                                                        <Sparkle weight="duotone" className="h-3 w-3" />
                                                        {user.customStatus}
                                                    </span>
                                                </>
                                            )}
                                        </p>
                                    </div>

                                    {user.bio && (
                                        <p className="text-sm text-foreground/90 leading-relaxed max-w-xl whitespace-pre-wrap">
                                            {user.bio}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                                        <div className="flex items-center gap-1">
                                            <Info weight="duotone" className="h-3.5 w-3.5" />
                                            <span>Joined {formattedJoinDate}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
