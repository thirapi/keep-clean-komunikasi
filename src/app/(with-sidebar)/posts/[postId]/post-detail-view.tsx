"use client";

import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { useState, useEffect, useRef } from "react";
import { PostItem } from "@/app/(with-sidebar)/profile/[username]/components/post-item";
import { SimpleReplyInput } from "@/app/(with-sidebar)/profile/[username]/components/simple-reply-input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPostThreadAction } from "../../../posts.action";

interface PostDetailViewProps {
    initialPost: PostWithUserDTO;
    initialReplies: PostWithUserDTO[];
    initialParents: PostWithUserDTO[];
    initialThread: PostWithUserDTO[];
    currentUser: any;
}

export default function PostDetailView({ initialPost, initialReplies, initialParents, initialThread, currentUser }: PostDetailViewProps) {
    const { toggleSidebar } = useSidebar();
    const queryClient = useQueryClient();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    // Unified Detail Query using React Query
    const { data: threadData } = useQuery({
        queryKey: ["posts", "detail", initialPost.id],
        queryFn: async () => {
            const res = await getPostThreadAction(initialPost.id, currentUser?.id);
            return res.data;
        },
        initialData: { post: initialPost, replies: initialReplies, parents: initialParents, thread: initialThread },
        staleTime: 5000,
    });

    const post = threadData?.post || initialPost;
    const replies = threadData?.replies || initialReplies;
    const parents = threadData?.parents || initialParents;
    const authorThread = threadData?.thread || [];

    // Refs for anchoring
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const focusedPostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);

        let attempts = 0;
        const scrollAndCheck = () => {
            if (scrollContainerRef.current && focusedPostRef.current) {
                const offset = parents.length > 0 ? focusedPostRef.current.offsetTop : 0;
                if (parents.length > 0 && offset === 0 && attempts < 30) {
                    attempts++;
                    requestAnimationFrame(scrollAndCheck);
                } else {
                    scrollContainerRef.current.scrollTop = offset;
                }
            }
        };

        const timer = setTimeout(scrollAndCheck, 50);
        return () => clearTimeout(timer);
    }, [post.id, parents.length]);

    const handleUpdate = (updatedItem?: any) => {
        // Only invalidate thread if it's likely a reply to THIS post
        // or if no item is passed (fallback to full refresh)
        if (!updatedItem || updatedItem.replyToId === post.id) {
            queryClient.invalidateQueries({ queryKey: ["posts", "detail", initialPost.id] });
        }
        // For other things (reposts of this post, bookmarks), 
        // the PostItem's internal updatePostInCache already handled it.
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex justify-center flex-1 overflow-hidden">
                <div className="w-full max-w-2xl border-x border-border/50 flex flex-col h-full">

                    {/* Header */}
                    <div className="px-4 py-3 sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border flex items-center gap-3">
                        <div className="md:hidden flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    if (document.referrer.includes(window.location.host) && window.history.length > 2) {
                                        router.back();
                                    } else {
                                        router.push("/timeline");
                                    }
                                }}
                                className="mr-1 -ml-2 -my-2 h-10 w-10 text-muted-foreground rounded-full transition-colors duration-200 flex-shrink-0"
                                aria-label="Go back"
                            >
                                <CaretLeft weight="duotone" className="h-7 w-7" />
                            </Button>
                        </div>

                        <h1 className="text-xl font-bold tracking-tight">Postingan</h1>
                    </div>

                    <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto">
                        {/* Parent Chain */}
                        {parents.length > 0 && (
                            <div className="flex flex-col">
                                {parents.map((parent, index) => (
                                    <PostItem
                                        key={parent.id}
                                        post={parent}
                                        currentUser={currentUser}
                                        currentUserId={currentUser?.id}
                                        showConnector={true}
                                        isFirstInChain={index === 0}
                                        isLastInChain={false}
                                        onUpdate={handleUpdate}
                                        hideReplyIndicator={true}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Focused Post & Replies Container */}
                        <div className={cn("flex flex-col", parents.length > 0 && "min-h-[calc(100dvh-60px)] pb-[40vh]")}>
                            {/* Focused Post */}
                            <div ref={focusedPostRef}>
                                <PostItem
                                    post={post}
                                    currentUser={currentUser}
                                    currentUserId={currentUser?.id}
                                    isFocused={true}
                                    showConnector={authorThread.length > 0 || !!currentUser}
                                    isFirstInChain={parents.length === 0}
                                    onUpdate={handleUpdate}
                                    hideReplyIndicator={parents.length > 0}
                                />
                            </div>

                            {/* Reply Input (Moved here, below Focused Post) */}
                            {currentUser && (
                                <SimpleReplyInput
                                    postId={post.id}
                                    currentUser={currentUser}
                                    onReplyCreated={handleUpdate}
                                    showConnector={authorThread.length > 0}
                                />
                            )}

                            {/* Author's Thread Chain (Descendants) */}
                            {authorThread.length > 0 && (
                                <div className="flex flex-col">
                                    {authorThread.map((threadPost, index) => (
                                        <PostItem
                                            key={threadPost.id}
                                            post={threadPost}
                                            currentUser={currentUser}
                                            showConnector={true}
                                            isLastInChain={index === authorThread.length - 1}
                                            onUpdate={handleUpdate}
                                            hideReplyIndicator={true}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* General Replies (Other Authors) */}
                            <div className="flex flex-col">
                                {replies.map((reply) => (
                                    <PostItem
                                        key={reply.id}
                                        post={reply}
                                        currentUser={currentUser}
                                        onUpdate={handleUpdate}
                                        hideReplyIndicator={true}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
