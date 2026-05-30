"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPublicProfileAction, followUserAction, unfollowUserAction, followRemoteUserAction, unfollowRemoteUserAction } from "@/app/(with-sidebar)/user.action";
import { Loader2, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

interface UserHoverCardProps {
    user: {
        username: string;
        identifier: string; // Correct ID for fetching (@user@domain for remote, username for local)
        displayName?: string;
        avatar?: string;
        handle: string;
        profilePath: string;
        isRemote?: boolean;
    };
    currentUserId?: string;
    children: React.ReactNode;
}

export function UserHoverCard({ user, currentUserId, children }: UserHoverCardProps) {
    const queryClient = useQueryClient();

    const { data: profile, isLoading } = useQuery({
        queryKey: ["user-profile", user.identifier],
        queryFn: async () => {
            const res = await getPublicProfileAction(user.identifier, currentUserId);
            return res.data;
        },
        enabled: !!user.identifier,
        staleTime: 60000, // 1 minute
    });

    const followMutation = useMutation({
        mutationFn: async () => {
            if (!currentUserId || !profile?.id) return;
            
            if (profile.isFollowing) {
                if (profile.isRemote) {
                    return await unfollowRemoteUserAction(currentUserId, profile.id);
                }
                return await unfollowUserAction(currentUserId, profile.id);
            } else {
                if (profile.isRemote && profile.handle) {
                    return await followRemoteUserAction(currentUserId, profile.handle);
                }
                return await followUserAction(currentUserId, profile.id);
            }
        },
        onSuccess: (res) => {
            if (res?.status === "success") {
                queryClient.setQueryData(["user-profile", user.identifier], (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        isFollowing: !old.isFollowing,
                        stats: {
                            ...old.stats,
                            followers: old.isFollowing ? Math.max(0, (old.stats?.followers || 1) - 1) : (old.stats?.followers || 0) + 1
                        }
                    };
                });
                // Invalidate to keep in sync with other components
                queryClient.invalidateQueries({ queryKey: ["user-profile", user.identifier] });
                toast.success(profile?.isFollowing ? "Batal mengikuti" : "Berhasil mengikuti");
            } else {
                toast.error(res?.error?.message || "Gagal mengubah status mengikuti");
            }
        },
        onError: (err: any) => {
            toast.error(err.message || "Gagal mengubah status mengikuti");
        }
    });

    const displayData = profile || {
        ...user,
        stats: { followers: 0, following: 0 },
        isFollowing: false,
        bio: "",
        banner: null
    };

    const isMe = currentUserId === profile?.id;

    return (
        <HoverCard openDelay={400} closeDelay={200}>
            <HoverCardTrigger asChild>
                <div className="inline-block cursor-pointer">
                    {children}
                </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-0 overflow-hidden shadow-2xl border-border bg-popover z-[1000]">
                <div className="flex flex-col">
                    {/* Banner */}
                    <div className="h-20 w-full bg-accent relative overflow-hidden">
                        {displayData.banner && (
                            <img src={displayData.banner} alt="" className="w-full h-full object-cover" />
                        )}
                    </div>
                    
                    <div className="px-4 pb-4 -mt-8 flex flex-col gap-3 relative">
                        <div className="flex justify-between items-end">
                            <UserAvatar 
                                src={displayData.avatar || "/avatars/avatar1.png"} 
                                className="h-16 w-16 border-4 border-popover" 
                            />
                            {currentUserId && !isMe && (
                                <Button 
                                    size="sm" 
                                    variant={displayData.isFollowing ? "outline" : "default"} 
                                    className={cn(
                                        "rounded-full font-bold px-5 h-8 text-[14px] transition-all gap-1.5",
                                        !displayData.isFollowing && "bg-foreground text-background hover:bg-foreground/90"
                                    )}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        followMutation.mutate();
                                    }}
                                    disabled={followMutation.isPending || isLoading}
                                >
                                    {followMutation.isPending ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : displayData.isFollowing ? (
                                        <>
                                            <UserMinus className="h-3.5 w-3.5" />
                                            <span>Mengikuti</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="h-3.5 w-3.5" />
                                            <span>Ikuti</span>
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                        
                        <div className="flex flex-col leading-tight">
                            <Link href={user.profilePath} className="font-bold text-[18px] hover:underline" onClick={(e) => e.stopPropagation()}>
                                {displayData.displayName || (displayData as any).name || user.username}
                            </Link>
                            <span className="text-muted-foreground text-[14px]">
                                {displayData.handle || user.handle}
                            </span>
                        </div>
                        
                        {isLoading ? (
                            <div className="flex items-center gap-2 py-2">
                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Memuat profil...</span>
                            </div>
                        ) : (
                            displayData.bio && (
                                <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap line-clamp-3">
                                    {displayData.bio}
                                </p>
                            )
                        )}
                        
                        {!isLoading && (
                            <div className="flex gap-4 text-[14px]">
                                <div className="flex gap-1 items-baseline hover:underline cursor-pointer">
                                    <span className="font-bold text-foreground">{displayData.stats?.following || 0}</span>
                                    <span className="text-muted-foreground">Mengikuti</span>
                                </div>
                                <div className="flex gap-1 items-baseline hover:underline cursor-pointer">
                                    <span className="font-bold text-foreground">{displayData.stats?.followers || 0}</span>
                                    <span className="text-muted-foreground">Pengikut</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
