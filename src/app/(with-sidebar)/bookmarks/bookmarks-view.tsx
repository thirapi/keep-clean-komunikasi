"use client";

import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { PostItem } from "@/app/(with-sidebar)/profile/[username]/components/post-item";
import { getBookmarkedPostsAction } from "@/app/posts.action";
import { useQueryClient } from "@tanstack/react-query";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Loader2, Bookmark } from "lucide-react";
import { useFeedWithOptimistic } from "@/hooks/use-feed-with-optimistic";

interface BookmarksViewProps {
    initialPosts: PostWithUserDTO[];
    currentUser: any;
}

export default function BookmarksView({
    initialPosts,
    currentUser,
}: BookmarksViewProps) {
    const QUERY_KEY = ["posts", "feed", "bookmarks"];
    const { toggleSidebar } = useSidebar();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialPosts.length === 20);

    const { data: posts, refetch, isFetching, isLoading } = useFeedWithOptimistic(
        QUERY_KEY,
        async () => {
            const res = await getBookmarkedPostsAction(currentUser?.id);
            const data = res.data || [];
            setHasMore(data.length === 20);
            return data;
        },
        true
    );

    const handleLoadMore = async () => {
        if (isFetching || isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const res = await getBookmarkedPostsAction(currentUser?.id, 20, posts.length);
            if (res.status === "success" && res.data) {
                const newPosts = res.data;
                queryClient.setQueryData(QUERY_KEY, (old: any) => [...(old || []), ...newPosts]);
                if (newPosts.length < 20) setHasMore(false);
            }
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isFetching) {
                    handleLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, isFetching, posts.length]);

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="flex justify-center flex-1 overflow-hidden">
                <div className="w-full max-w-2xl border-x border-border/50 bg-background/30 flex flex-col h-full relative">
                    <div className="px-4 py-3 md:px-6 md:py-4 sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/10 flex items-center gap-4 shrink-0">
                        <div className="md:hidden">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleSidebar()}
                                className="mr-1 -ml-2 -my-2 h-10 w-10 text-muted-foreground rounded-full bg-accent/50 border-2 border-accent transition-colors duration-200 flex-shrink-0"
                                aria-label="Toggle sidebar"
                            >
                                <ChevronLeft strokeWidth="4" className="h-7 w-7" />
                            </Button>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight flex-1">Bookmark</h1>
                        {isFetching && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="h-1 w-1 rounded-full bg-current animate-ping" />
                                <span className="animate-pulse">Memperbarui...</span>
                            </div>
                        )}
                    </div>

                    <div
                        ref={scrollContainerRef}
                        className="flex-1 overflow-y-auto custom-scrollbar relative"
                    >
                        <div className="flex flex-col">
                            {isLoading ? (
                                <div className="p-20 flex flex-col items-center justify-center gap-3 text-muted-foreground select-none">
                                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                                    <span className="text-sm font-medium">Memuat bookmark...</span>
                                </div>
                            ) : posts.length > 0 ? (
                                posts.map((post: PostWithUserDTO) => (
                                    <PostItem
                                        key={post.id}
                                        post={post}
                                        currentUserId={currentUser?.id}
                                        currentUser={currentUser ? {
                                            id: currentUser.id,
                                            username: currentUser.username,
                                            avatar: currentUser.avatar
                                        } : undefined}
                                        onUpdate={() => refetch()}
                                    />
                                ))
                            ) : (
                                <div className="p-20 flex flex-col items-center justify-center gap-4 text-center opacity-40 select-none">
                                    <Bookmark className="h-12 w-12 text-muted-foreground" />
                                    <div className="flex flex-col gap-1">
                                        <p className="font-bold text-lg text-foreground">Belum ada bookmark</p>
                                        <p className="text-sm italic text-muted-foreground max-w-xs">
                                            Simpan postingan yang Anda sukai untuk dibaca kembali di sini nanti.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {hasMore && (
                                <div ref={loadMoreRef} className="p-8 flex justify-center min-h-[64px] items-center">
                                    {isLoadingMore && (
                                        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                                    )}
                                </div>
                            )}

                            {!hasMore && posts.length > 0 && (
                                <div className="p-12 text-center opacity-20 border-t border-white/5">
                                    <p className="text-sm italic text-muted-foreground">Ini adalah akhir dari bookmark Anda ✨</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
