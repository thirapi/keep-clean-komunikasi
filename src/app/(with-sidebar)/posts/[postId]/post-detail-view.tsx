"use client";

import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { useState, useEffect, useRef } from "react";
import { PostItem } from "@/app/profile/[username]/components/post-item";
import { SimpleReplyInput } from "@/app/profile/[username]/components/simple-reply-input";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPostThreadAction } from "../../../posts.action";

interface PostDetailViewProps {
    initialPost: PostWithUserDTO;
    initialReplies: PostWithUserDTO[];
    initialParents: PostWithUserDTO[];
    currentUser: any;
}

export default function PostDetailView({ initialPost, initialReplies, initialParents, currentUser }: PostDetailViewProps) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    // Unified Detail Query using React Query
    const { data: threadData } = useQuery({
        queryKey: ["posts", "detail", initialPost.id],
        queryFn: async () => {
            const res = await getPostThreadAction(initialPost.id);
            return res.data;
        },
        initialData: { post: initialPost, replies: initialReplies, parents: initialParents },
        staleTime: 5000,
    });

    const post = threadData?.post || initialPost;
    const replies = threadData?.replies || initialReplies;
    const parents = threadData?.parents || initialParents;

    // Refs for anchoring
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const focusedPostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);

        // Initial Anchoring
        const timer = setTimeout(() => {
            if (focusedPostRef.current) {
                focusedPostRef.current.scrollIntoView({ behavior: "instant", block: "start" });
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const handleNewReplyCreated = () => {
        // Just invalidate the specific thread
        queryClient.invalidateQueries({ queryKey: ["posts", "detail", initialPost.id] });
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex justify-center flex-1">
                <div className="w-full max-w-2xl border-x border-border/50 flex flex-col h-full">

                    {/* Header */}
                    <div className="px-4 py-3 sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/10 flex items-center gap-3">
                        {isMounted && (
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-white rounded-full hover:bg-white/10" onClick={() => router.back()}>
                                <ChevronLeft strokeWidth="3" className="h-6 w-6" />
                            </Button>
                        )}
                        <h1 className="text-xl font-bold tracking-tight text-white">Postingan</h1>
                    </div>

                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scroll-smooth">
                        {/* Parent Chain */}
                        {parents.length > 0 && (
                            <div className="flex flex-col">
                                {parents.map((parent) => (
                                    <PostItem
                                        key={parent.id}
                                        post={parent}
                                        currentUser={currentUser}
                                        showConnector={true}
                                        isLastInChain={false}
                                        onUpdate={handleNewReplyCreated}
                                        hideReplyIndicator={true}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Focused Post */}
                        <div ref={focusedPostRef}>
                            <PostItem
                                post={post}
                                currentUser={currentUser}
                                isFocused={true}
                                onUpdate={handleNewReplyCreated}
                                hideReplyIndicator={parents.length > 0}
                            />
                        </div>

                        {/* Reply Input */}
                        {currentUser && (
                            <div className="px-4 py-3 border-b border-border/10">
                                <SimpleReplyInput
                                    postId={post.id}
                                    currentUser={currentUser}
                                    onReplyCreated={handleNewReplyCreated}
                                />
                            </div>
                        )}

                        {/* Replies */}
                        <div className="flex flex-col">
                            {replies.map((reply) => (
                                <PostItem
                                    key={reply.id}
                                    post={reply}
                                    currentUser={currentUser}
                                    onUpdate={handleNewReplyCreated}
                                    hideReplyIndicator={true}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
