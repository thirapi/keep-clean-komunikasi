"use client";

import React, { useMemo } from "react";
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
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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
    const isMobile = useIsMobile();
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

    return (
        <div className="flex flex-col h-full bg-background/50 pb-[72px] md:pb-0">
            <div className="flex justify-center flex-1 overflow-hidden">
                <div className="w-full max-w-lg border-x border-border/50 bg-background/30 flex flex-col h-full relative">
                    <div className="px-4 py-2 md:px-6 md:py-3 sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between shrink-0">
                        <span className={cn("text-sm font-medium text-muted-foreground truncate", isMobile && "ml-4")}>
                            @{user.username.toLowerCase()}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={handleCopyLink} className="rounded-xl hover:bg-muted h-8 w-8" title="Salin link">
                                <ShareNetwork className="h-4 w-4" />
                            </Button>
                            {isOwnProfile ? (
                                <UserSettingsDialog
                                    user={currentUser as any}
                                    trigger={
                                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted h-8 w-8" title="Edit Profil">
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
                                    className="rounded-xl hover:bg-muted text-primary h-8 w-8"
                                    title="Kirim Pesan"
                                >
                                    <ChatTeardropText weight="duotone" className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
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

                        <div className="flex flex-col items-center px-6 pb-8">
                            <div className={cn("relative", user.banner ? "-mt-10 sm:-mt-12 mb-3" : "mt-8 mb-3")}>
                                <UserAvatar
                                    src={user.avatar}
                                    className={cn(
                                        "ring-4 ring-background shadow-xl",
                                        user.banner ? "h-20 w-20 sm:h-24 sm:w-24" : "h-20 w-20 sm:h-24 sm:w-24 rounded-full",
                                    )}
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

                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-5">
                                <span>Bergabung {formattedJoinDate}</span>
                            </div>

                            {!isOwnProfile && currentUser && (
                                <Button
                                    onClick={handleStartDM}
                                    disabled={isRedirecting}
                                    className="mt-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 h-10 w-full max-w-xs"
                                >
                                    <ChatTeardropText weight="duotone" className="h-4 w-4 mr-2" />
                                    Kirim Pesan
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
