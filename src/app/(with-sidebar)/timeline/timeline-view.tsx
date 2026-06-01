"use client";

import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, RotateCw } from "lucide-react";
import { PostInput } from "@/app/(with-sidebar)/profile/[username]/components/post-input";
import { PostItem } from "@/app/(with-sidebar)/profile/[username]/components/post-item";
import { useFeedWithOptimistic } from "@/hooks/use-feed-with-optimistic";
import { getGlobalFeedAction } from "@/app/posts.action";
import { useCreatePost } from "@/hooks/use-create-post";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface TimelineViewProps {
    initialPosts: PostWithUserDTO[];
    currentUser: any;
    title?: string;
    queryKey?: string[];
    feedAction?: (userId: string | undefined, limit?: number, offset?: number, filter?: any) => Promise<any>;
    initialTab?: "all" | "local";
}

export default function TimelineView({
    initialPosts,
    currentUser,
    title = "Timeline",
    queryKey: propQueryKey,
    feedAction: propFeedAction,
    initialTab = "all"
}: TimelineViewProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const queryClient = useQueryClient();

    // Sync tab with URL
    const tabFromUrl = searchParams.get("tab") as "all" | "local" | null;
    const [activeTab, setActiveTab] = useState<"all" | "local">(tabFromUrl || initialTab);

    const handleTabChange = (tabId: "all" | "local") => {
        setActiveTab(tabId);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tabId);
        router.replace(`${pathname}?${params.toString()}`);
    };

    const QUERY_KEY = propQueryKey || ["posts", "feed", "global", activeTab];
    const FETCH_ACTION = (propFeedAction || getGlobalFeedAction) as (userId: string | undefined, limit?: number, offset?: number, filter?: any) => Promise<any>;

    const { toggleSidebar } = useSidebar();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const [newPostsCount, setNewPostsCount] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialPosts.length === 20);

    const { data: posts, refetch, isFetching, isLoading } = useFeedWithOptimistic(
        QUERY_KEY,
        async () => {
            const res = await FETCH_ACTION(currentUser?.id, 20, 0, activeTab);
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
            const res = await FETCH_ACTION(currentUser?.id, 20, posts.length, activeTab);
            if (res.status === "success" && res.data) {
                const newPosts = res.data;
                queryClient.setQueryData(QUERY_KEY, (old: any) => [...(old || []), ...newPosts]);
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
    }, [hasMore, isLoadingMore, isFetching, posts.length, activeTab]);

    const { data: latestData } = useQuery({
        queryKey: ["posts", "poll", QUERY_KEY[QUERY_KEY.length - 1]],
        queryFn: async () => {
            const res = await FETCH_ACTION(currentUser?.id, 20, 0, activeTab);
            return res.data || [];
        },
        refetchInterval: 25000, // 25 seconds poll
        enabled: !!currentUser,
    });

    // Check for new posts whenever poll completes
    useEffect(() => {
        if (latestData && posts && posts.length > 0) {
            // Find the first post in latestData that we ALREADY have in our local posts list
            // We check both ID and content/timestamp as fallback for optimistic posts
            const firstKnownIndex = latestData.findIndex((lp: any) =>
                posts.some((p: any) => p.id === lp.id || (p as any).optimisticId === lp.id)
            );

            if (firstKnownIndex > 0) {
                // There are posts newer than our newest known post
                const newPosts = latestData.slice(0, firstKnownIndex);
                const filteredNewCount = newPosts.filter((p: any) => p.userId !== currentUser?.id).length;
                setNewPostsCount(filteredNewCount);
            } else if (firstKnownIndex === -1) {
                // We are very far behind or something went wrong, 
                // but let's still filter out our own posts if we can
                const filteredNewCount = latestData.filter((p: any) => p.userId !== currentUser?.id).length;
                setNewPostsCount(filteredNewCount > 0 ? filteredNewCount : 0);
            } else {
                setNewPostsCount(0);
            }
        }
    }, [latestData, posts, currentUser?.id, activeTab]);

    const handleRefresh = async () => {
        setNewPostsCount(0);
        await queryClient.invalidateQueries({ queryKey: ["posts", "poll", QUERY_KEY[QUERY_KEY.length - 1]] });
        await refetch();
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const { mutate: createPost } = useCreatePost(QUERY_KEY);

    const handlePostCreated = (content: string) => {
        createPost({
            userId: currentUser.id,
            content,
            username: currentUser.username,
            avatar: currentUser.avatar
        });
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const tabs = [
        { id: "all", label: "Federasi" },
        { id: "local", label: "Lokal" }
    ];

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="flex justify-center flex-1 overflow-hidden">
                <div className="w-full max-w-2xl border-x border-border/50 bg-background/30 flex flex-col h-full relative">
                    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/10 shrink-0">
                        <div className="px-4 py-3 md:px-6 md:py-4 flex items-center gap-4">
                            <div className="md:hidden">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                    className="mr-1 -ml-2 -my-2 h-10 w-10 text-foreground rounded-full hover:bg-accent transition-colors duration-200 flex-shrink-0"
                                    aria-label="Back to channels"
                                >
                                    <Link href="/channels/default">
                                        <ChevronLeft className="h-6 w-6" />
                                    </Link>
                                </Button>
                            </div>
                            <h1 className="text-xl font-bold tracking-tight flex-1">{title}</h1>
                            
                            <div className="flex items-center gap-2">
                                {isFetching && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mr-2">
                                        <div className="h-1 w-1 rounded-full bg-current animate-ping" />
                                        <span className="animate-pulse hidden sm:inline">Memperbarui...</span>
                                    </div>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRefresh}
                                    className="rounded-full hover:bg-sky-500/10 hover:text-sky-500 transition-colors h-9 w-9"
                                    disabled={isFetching}
                                >
                                    <RotateCw className={cn("h-5 w-5", isFetching && "animate-spin")} />
                                </Button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex w-full border-b border-border">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id as any)}
                                    className={cn(
                                        "flex-1 py-3.5 text-sm font-bold transition-all relative",
                                        activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03]"
                                    )}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500 rounded-full mx-8" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* New Post Indicator */}
                    {newPostsCount > 0 && (
                        <div className="absolute top-[115px] left-1/2 -translate-x-1/2 z-30 transition-all animate-in slide-in-from-top-2 fade-in duration-300">
                            <Button
                                onClick={handleRefresh}
                                size="sm"
                                className="bg-sky-500 hover:bg-sky-600 text-white rounded-full shadow-lg h-9 px-4 flex items-center gap-2 border-none"
                            >
                                <Sparkles className="h-4 w-4" />
                                <span className="font-bold">{newPostsCount} Postingan Baru</span>
                            </Button>
                        </div>
                    )}

                    <div
                        ref={scrollContainerRef}
                        className="flex-1 overflow-y-auto custom-scrollbar relative"
                    >
                        {currentUser && (
                            <div className="border-b border-border/10 bg-background/20 backdrop-blur-sm">
                                <PostInput
                                    currentUser={currentUser}
                                    onPostCreated={(post) => {
                                        if (scrollContainerRef.current) {
                                            scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
                                        }
                                        refetch();
                                    }}
                                />
                            </div>
                        )}

                        <div className="flex flex-col">
                            {isLoading ? (
                                <div className="p-20 flex flex-col items-center justify-center gap-3 text-muted-foreground select-none">
                                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                                    <span className="text-sm font-medium">Memuat timeline...</span>
                                </div>
                            ) : posts.length > 0 ? (
                                (() => {
                                    // Robust Grouping Logic
                                    const groupedItems: (PostWithUserDTO | PostWithUserDTO[])[] = [];
                                    const processedIds = new Set<string>();

                                    for (let i = 0; i < posts.length; i++) {
                                        const post = posts[i];
                                        if (processedIds.has(post.id)) continue;

                                        let thread: PostWithUserDTO[] = [post];
                                        processedIds.add(post.id);

                                        let currentPost = post;
                                        // In reverse-chronological feed, the PARENT is further down the array (older)
                                        // We look ahead to see if the current post is a reply to something we have in the current list
                                        let j = i + 1;
                                        while (j < posts.length) {
                                            const potentialParent = posts[j];
                                            if (!processedIds.has(potentialParent.id) &&
                                                currentPost.replyToId === potentialParent.id &&
                                                currentPost.userId === potentialParent.userId) {
                                                thread.push(potentialParent);
                                                processedIds.add(potentialParent.id);
                                                currentPost = potentialParent;
                                                j++;
                                            } else {
                                                break;
                                            }
                                        }

                                        if (thread.length > 1) {
                                            // thread is [Newest, ..., Oldest]
                                            // We reverse it to [Oldest, ..., Newest] for chronological reading within the block
                                            groupedItems.push(thread.reverse());
                                        } else {
                                            groupedItems.push(post);
                                        }
                                    }

                                    return groupedItems.map((item) => {
                                        if (Array.isArray(item)) {
                                            return (
                                                <div key={`group-${item[0].id}`} className="flex flex-col">
                                                    {item.map((post, idx) => (
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
                                                            showConnector={idx < item.length - 1}
                                                            isFirstInChain={idx === 0}
                                                            isLastInChain={idx === item.length - 1}
                                                            hideReplyIndicator={idx > 0}
                                                        />
                                                    ))}
                                                </div>
                                            );
                                        }

                                        return (
                                            <PostItem
                                                key={item.id}
                                                post={item}
                                                currentUserId={currentUser?.id}
                                                currentUser={currentUser ? {
                                                    id: currentUser.id,
                                                    username: currentUser.username,
                                                    avatar: currentUser.avatar
                                                } : undefined}
                                                onUpdate={() => refetch()}
                                            />
                                        );
                                    });
                                })()
                            ) : (
                                <div className="p-20 text-center opacity-30 select-none">
                                    <span className="text-muted-foreground font-medium italic">Timeline kosong. Mari mulai berbagi!</span>
                                </div>
                            )}

                            {hasMore && (
                                <div ref={loadMoreRef} className="p-8 flex justify-center min-h-[64px] items-center">
                                    {isLoadingMore && (
                                        <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                                    )}
                                </div>
                            )}

                            {!hasMore && posts.length > 0 && (
                                <div className="p-12 text-center opacity-20 border-t border-white/5">
                                    <p className="text-sm italic text-muted-foreground">Anda sudah melihat semuanya ✨</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
