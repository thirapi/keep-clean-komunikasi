"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { usePresence } from "@/components/presence-provider";
import { ChatTeardropText, Sparkle, Pencil, ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { createRoom } from "../../channels/[roomId]/room.action";
import { getPublicProfileAction } from "../../user.action";
import { toast } from "sonner";
import { UserSettingsDialog } from "../../user-settings-dialog";
import { SharedMediaGrid } from "@/components/shared-media-grid";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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

export default function ProfileView({ user: initialUser, currentUser }: ProfileViewProps) {
    const { onlineUserIds } = usePresence();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = React.useState(false);

    const { data: user } = useQuery({
        queryKey: ["profile", initialUser.username],
        queryFn: () => getPublicProfileAction(initialUser.username, currentUser?.id).then(r => r.data ?? initialUser),
        initialData: initialUser,
        staleTime: 60_000,
    });

    const isOwnProfile = currentUser?.id === user.id;
    const isUserOnline = onlineUserIds.includes(user.id);

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

    const formattedJoinDate = useMemo(() => {
        try {
            const date = new Date(user.createdAt);
            if (isNaN(date.getTime())) return "Januari 2025";
            return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
        } catch {
            return "Januari 2025";
        }
    }, [user.createdAt]);

    const isMobile = useIsMobile();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showStickyHeader, setShowStickyHeader] = useState(false);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el || !isMobile) return;

        const handleScroll = () => {
            setShowStickyHeader(el.scrollTop > 120);
        };

        el.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => el.removeEventListener("scroll", handleScroll);
    }, [isMobile]);

    return (
        <div className="flex flex-col h-full bg-background/50 pb-[72px] md:pb-0">
            <div className="flex justify-center flex-1 overflow-hidden">
                <div className={cn(
                    "w-full border-x border-border/50 bg-background/30 flex flex-col h-full relative",
                    "max-w-lg lg:max-w-2xl",
                )}>

                    {isMobile && (
                        <div
                            className={cn(
                                "absolute top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 transition-opacity duration-200",
                                showStickyHeader ? "opacity-100" : "opacity-0 pointer-events-none",
                            )}
                        >
                            <div className="flex items-center gap-3 px-4 h-12">
                                <UserAvatar
                                    src={user.avatar}
                                    className="h-8 w-8 ring-2 ring-background shrink-0"
                                />
                                <div className="flex flex-col leading-tight min-w-0">
                                    <span className="text-sm font-semibold truncate">Profil</span>
                                    <span className="text-xs text-muted-foreground truncate">
                                        @{user.username.toLowerCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    {!isMobile && (
                        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 shrink-0 h-0" />
                    )}

                    <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar relative">

                        {/* Banner */}
                        {user.banner && (
                            <div
                                className="h-24 sm:h-28 w-full bg-muted relative shrink-0"
                                style={{
                                    background: (user.banner.startsWith("http") || user.banner.startsWith("/"))
                                        ? `url(${user.banner}) center/cover no-repeat`
                                        : user.banner,
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            </div>
                        )}

                        {/* Profile info */}
                        <div className="flex flex-col items-center px-6 pb-4">
                            <div className={cn("relative", user.banner ? "-mt-10 sm:-mt-12 mb-3" : "mt-8 mb-3")}>
                                <UserAvatar
                                    src={user.avatar}
                                    className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-background shadow-xl rounded-full"
                                />
                                {isUserOnline && (
                                    <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 bg-emerald-500 rounded-full border-[3px] border-background shadow" />
                                )}
                            </div>

                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-center">
                                {user.displayName || user.username}
                            </h1>
                            <p className="text-sm text-muted-foreground text-center">
                                @{user.username.toLowerCase()}
                                {user.customStatus && (
                                    <>
                                        <span className="text-border mx-1.5">•</span>
                                        <span className="inline-flex items-center gap-1 text-amber-500/80">
                                            <Sparkle weight="duotone" className="h-3 w-3" />
                                            {user.customStatus}
                                        </span>
                                    </>
                                )}
                            </p>

                            {user.bio && (
                                <p className="text-sm text-foreground/90 leading-relaxed text-center max-w-sm mt-4 whitespace-pre-wrap">
                                    {user.bio}
                                </p>
                            )}

                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-6">
                                <span>Bergabung {formattedJoinDate}</span>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center justify-center gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopyLink}
                                    className="rounded-full h-10 w-10"
                                    title="Salin link"
                                >
                                    <ShareNetwork className="h-4 w-4" />
                                </Button>

                                {isOwnProfile ? (
                                    <UserSettingsDialog
                                        user={currentUser as any}
                                        trigger={
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="rounded-full h-10 w-10"
                                                title="Edit Profil"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        }
                                    />
                                ) : currentUser ? (
                                    <Button
                                        onClick={handleStartDM}
                                        disabled={isRedirecting}
                                        className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 h-10"
                                    >
                                        <ChatTeardropText weight="duotone" className="h-4 w-4 mr-2" />
                                        Kirim Pesan
                                    </Button>
                                ) : null}
                            </div>
                        </div>

                        {/* Shared media — full width */}
                        {currentUser && (
                            <SharedMediaGrid
                                currentUserId={currentUser.id}
                                profileUsername={user.username}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
