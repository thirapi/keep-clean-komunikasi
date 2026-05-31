"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { usePresence } from "@/components/presence-provider";
import {
    MessageSquare,
    Sparkles,
    ArrowLeft,
    Share2,
    Info,
    UserPen,
    Loader2,
    ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createRoom } from "../../channels/[roomId]/room.action";
import { getProfileFeedAction, getProfileFeedCountAction } from "../../../posts.action";
import { PostInput } from "./components/post-input";
import { PostItem } from "./components/post-item";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UserSettingsDialog } from "../../user-settings-dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { FollowButton } from "./components/follow-button";
import { UserListDialog } from "./components/user-list-dialog";
import { getFollowersAction, getFollowingAction } from "../../user.action";
import { parseFediverseContent } from "@/lib/fediverse-content-parser";

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
        stats?: {
            followers: number;
            following: number;
        };
        isFollowing?: boolean;
        isRemote?: boolean;
        handle?: string;
        emojis?: { name: string; url: string }[] | null;
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
    const { toggleSidebar } = useSidebar();
    const { onlineUserIds } = usePresence();
    const isUserOnline = onlineUserIds.includes(user.id);
    const router = useRouter();
    const queryClient = useQueryClient();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [activeTab, setActiveTab] = useState("Threads");
    const isOwnProfile = currentUser?.id === user.id;

    // Unified Post Query using React Query
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);

    const { data: posts = [], isLoading, refetch } = useQuery({
        queryKey: ["posts", "profile", user.id, activeTab],
        queryFn: async () => {
            let filter: any = "threads";
            if (activeTab === "Replies") filter = "replies";
            if (activeTab === "Reposts") filter = "reposts";
            if (activeTab === "Media") filter = "media";

            const response = await getProfileFeedAction(user.username, filter, currentUser?.id, 20, 0);
            if (response.status === "success" && response.data) {
                setHasMore(response.data.length === 20);
                return response.data;
            }
            return [];
        },
        staleTime: 5000,
    });

    const { data: postCount = 0 } = useQuery({
        queryKey: ["posts", "count", user.id, activeTab],
        queryFn: async () => {
            let filter: any = "threads";
            if (activeTab === "Replies") filter = "replies";
            if (activeTab === "Reposts") filter = "reposts";
            if (activeTab === "Media") filter = "media";

            const response = await getProfileFeedCountAction(user.username, filter);
            return response.status === "success" && response.data !== null ? response.data : 0;
        },
        staleTime: 5000,
    });

    const handleLoadMore = async () => {
        if (isLoading || isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            let filter: any = "threads";
            if (activeTab === "Replies") filter = "replies";
            if (activeTab === "Reposts") filter = "reposts";
            if (activeTab === "Media") filter = "media";

            const response = await getProfileFeedAction(user.username, filter, currentUser?.id, 20, posts.length);
            if (response.status === "success" && response.data) {
                const newPosts = response.data;
                queryClient.setQueryData(["posts", "profile", user.id, activeTab], (old: any) => [...(old || []), ...newPosts]);
                if (newPosts.length < 20) setHasMore(false);
            }
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
                    handleLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, isLoading, posts.length, activeTab]);

    const handlePostCreated = (newPost: any) => {
        queryClient.invalidateQueries({ queryKey: ["posts", "profile", user.id] });
    };

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
        <div className="flex flex-col h-full bg-background/50">
            <div className="flex justify-center flex-1 overflow-hidden">
                <div className="w-full max-w-2xl border-x border-border/50 bg-background/30 flex flex-col h-full relative overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 md:px-6 md:py-4 sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/10 flex items-center gap-4 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                if (document.referrer.includes(window.location.host) && window.history.length > 2) {
                                    router.back();
                                } else if (currentUser) {
                                    router.push("/timeline");
                                } else {
                                    router.push("/");
                                }
                            }}
                            className="rounded-full hover:bg-muted -ml-1"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col flex-1">
                            <h1 
                                className="text-xl font-bold tracking-tight"
                                dangerouslySetInnerHTML={{ __html: parseFediverseContent(user.displayName || user.username, user.emojis) }}
                            />
                            <p className="text-xs text-muted-foreground">{postCount} {activeTab}</p>
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
                        </div>
                    </div>

                    {/* Scrollable Container */}
                    <div
                        ref={scrollContainerRef}
                        className="flex-1 overflow-y-auto custom-scrollbar relative"
                    >
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
                                            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 rounded-full 
                        border-[3px] border-background shadow-lg" />
                                        )}
                                    </div>

                                    <div className="pt-4 flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleCopyLink}
                                            className="rounded-full border border-border/50"
                                        >
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                        {!isOwnProfile && currentUser && (
                                            <FollowButton
                                                targetUserId={user.id}
                                                currentUserId={currentUser.id}
                                                initialIsFollowing={user.isFollowing || false}
                                                isRemote={user.isRemote}
                                                handle={user.handle}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <div>
                                        <h2 
                                            className="text-2xl font-bold tracking-tight text-foreground"
                                            dangerouslySetInnerHTML={{ __html: parseFediverseContent(user.displayName || user.username, user.emojis) }}
                                        />
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            {user.isRemote && user.handle 
                                                ? user.handle 
                                                : `@${user.username.toLowerCase()}`}
                                            {user.customStatus && (
                                                <>
                                                    <span className="text-border">•</span>
                                                    <span className="flex items-center gap-1 text-amber-500/80">
                                                        <Sparkles className="h-3 w-3" />
                                                        {user.customStatus}
                                                    </span>
                                                </>
                                            )}
                                        </p>
                                    </div>

                                    {user.bio && (
                                        <p 
                                            className="text-sm text-foreground/90 leading-relaxed max-w-xl"
                                            dangerouslySetInnerHTML={{ __html: parseFediverseContent(user.bio, user.emojis) }}
                                        />
                                    )}

                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                                        <div className="flex items-center gap-1">
                                            <Info className="h-3.5 w-3.5" />
                                            <span>Joined {formattedJoinDate}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <UserListDialog
                                                title="Following"
                                                userId={user.id}
                                                fetchAction={getFollowingAction}
                                                trigger={
                                                    <div className="flex items-center gap-1 hover:underline cursor-pointer">
                                                        <span className="font-bold text-foreground">{user.stats?.following || 0}</span>
                                                        <span>Following</span>
                                                    </div>
                                                }
                                            />
                                            <UserListDialog
                                                title="Followers"
                                                userId={user.id}
                                                fetchAction={getFollowersAction}
                                                trigger={
                                                    <div className="flex items-center gap-1 hover:underline cursor-pointer">
                                                        <span className="font-bold text-foreground">{user.stats?.followers || 0}</span>
                                                        <span>Followers</span>
                                                    </div>
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex w-full border-b border-border/10 bg-background/80 backdrop-blur-md">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "flex-1 py-4 text-sm font-bold transition-all relative",
                                        activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full mx-4 sm:mx-8" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col min-h-[400px]">
                            {/* Display posts for any active tab that fetches data */}
                            <div className="flex flex-col animate-in fade-in duration-500">
                                {isOwnProfile && currentUser && activeTab === "Threads" && (
                                    <div className="border-b border-border/10">
                                        <PostInput
                                            currentUser={{
                                                id: currentUser.id,
                                                username: currentUser.name,
                                                avatar: currentUser.avatar,
                                            }}
                                            onPostCreated={handlePostCreated}
                                        />
                                    </div>
                                )}

                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                        <p className="text-muted-foreground text-sm">Memuat...</p>
                                    </div>
                                ) : posts.length > 0 ? (
                                    <div className="flex flex-col">
                                        {posts.map((post: any) => (
                                            <PostItem
                                                key={post.id}
                                                post={post}
                                                currentUserId={currentUser?.id}
                                                currentUser={currentUser ? {
                                                    id: currentUser.id,
                                                    username: currentUser.name,
                                                    avatar: currentUser.avatar
                                                } : undefined}
                                                onUpdate={handlePostCreated}
                                            />
                                        ))}

                                        {hasMore && (
                                            <div ref={loadMoreRef} className="p-8 flex justify-center min-h-[64px] items-center">
                                                {isLoadingMore && (
                                                    <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-20 opacity-30 select-none">
                                        <p className="text-sm font-medium italic text-muted-foreground">
                                            Belum ada postingan.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
