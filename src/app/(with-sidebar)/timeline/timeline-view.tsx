"use client";

import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { useRef } from "react";
import { PostInput } from "@/app/profile/[username]/components/post-input";
import { PostItem } from "@/app/profile/[username]/components/post-item";
import { useFeedWithOptimistic } from "@/hooks/use-feed-with-optimistic";
import { getGlobalFeedAction } from "@/app/posts.action";
import { useCreatePost } from "@/hooks/use-create-post";

interface TimelineViewProps {
    initialPosts: PostWithUserDTO[];
    currentUser: any;
    title?: string;
}

const QUERY_KEY = ["feed", "global"];

export default function TimelineView({ initialPosts, currentUser, title = "Timeline" }: TimelineViewProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const { data: posts, refetch } = useFeedWithOptimistic(
        QUERY_KEY,
        async () => {
            const res = await getGlobalFeedAction(currentUser?.id);
            return res.data || [];
        },
        true
    );

    // Pusher for Microblog is disabled per user request (Twitter-like approach)
    // We only rely on manual refetch or revalidation on focus/mount.

    const { mutate: createPost } = useCreatePost(QUERY_KEY);

    const handlePostCreated = (content: string) => {
        createPost({ userId: currentUser.id, content });
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="flex justify-center flex-1 overflow-hidden">
                <div className="w-full max-w-2xl border-x border-border/50 bg-background/30 flex flex-col h-full relative">
                    <div className="px-4 py-3 md:px-6 md:py-4 sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/10 flex items-center gap-3 shrink-0">
                        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
                    </div>

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
                                            username: currentUser.name,
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
