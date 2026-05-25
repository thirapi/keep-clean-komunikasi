"use client";

import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { useRef, useState, useEffect } from "react";
import { PostInput } from "@/app/profile/[username]/components/post-input";
import { PostItem } from "@/app/profile/[username]/components/post-item";
import { useFeedWithOptimistic } from "@/hooks/use-feed-with-optimistic";
import { getGlobalFeedAction } from "@/app/posts.action";
import { useCreatePost } from "@/hooks/use-create-post";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface TimelineViewProps {
    initialPosts: PostWithUserDTO[];
    currentUser: any;
    title?: string;
}

const QUERY_KEY = ["posts", "feed", "global"];

export default function TimelineView({ initialPosts, currentUser, title = "Timeline" }: TimelineViewProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const { data: posts, refetch, isFetching } = useFeedWithOptimistic(
        QUERY_KEY,
        async () => {
            const res = await getGlobalFeedAction(currentUser?.id);
            return res.data || [];
        },
        true
    );

    // Polling for new posts indicator
    const [newPostsCount, setNewPostsCount] = useState(0);
    const { data: latestData } = useQuery({
        queryKey: ["posts", "poll", "global"],
        queryFn: async () => {
            const res = await getGlobalFeedAction(currentUser?.id);
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
            const firstKnownIndex = latestData.findIndex(lp =>
                posts.some(p => p.id === lp.id || (p as any).optimisticId === lp.id)
            );

            if (firstKnownIndex > 0) {
                // There are posts newer than our newest known post
                const newPosts = latestData.slice(0, firstKnownIndex);
                const filteredNewCount = newPosts.filter(p => p.userId !== currentUser?.id).length;
                setNewPostsCount(filteredNewCount);
            } else if (firstKnownIndex === -1) {
                // We are very far behind or something went wrong, 
                // but let's still filter out our own posts if we can
                const filteredNewCount = latestData.filter(p => p.userId !== currentUser?.id).length;
                setNewPostsCount(filteredNewCount > 0 ? filteredNewCount : 0);
            } else {
                setNewPostsCount(0);
            }
        }
    }, [latestData, posts, currentUser?.id]);

    const handleRefresh = async () => {
        setNewPostsCount(0);
        await queryClient.invalidateQueries({ queryKey: ["posts", "poll", "global"] });
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

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="flex justify-center flex-1 overflow-hidden">
                <div className="w-full max-w-2xl border-x border-border/50 bg-background/30 flex flex-col h-full relative">
                    <div className="px-4 py-3 md:px-6 md:py-4 sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/10 flex items-center justify-between shrink-0">
                        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
                        {isFetching && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                                <div className="h-1 w-1 rounded-full bg-current" />
                                Memperbarui...
                            </div>
                        )}
                    </div>

                    {/* New Post Indicator */}
                    {newPostsCount > 0 && (
                        <div className="absolute top-[70px] left-1/2 -translate-x-1/2 z-30 transition-all animate-in slide-in-from-top-2 fade-in duration-300">
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
                            {posts.length > 0 ? (
                                posts.map((post) => (
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
                                <div className="p-20 text-center opacity-30 select-none">
                                    <span className="text-muted-foreground font-medium italic">Timeline kosong. Mari mulai berbagi!</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
