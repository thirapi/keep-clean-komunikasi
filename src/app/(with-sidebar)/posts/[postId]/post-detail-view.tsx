"use client";

import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { useState, useEffect } from "react";
import { PostItem } from "@/app/profile/[username]/components/post-item";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { pusher } from "@/lib/pusher/pusher.client";
import Link from "next/link";

interface PostDetailViewProps {
    initialPost: PostWithUserDTO;
    initialReplies: PostWithUserDTO[];
    currentUser: any;
}

export default function PostDetailView({ initialPost, initialReplies, currentUser }: PostDetailViewProps) {
    const [post, setPost] = useState(initialPost);
    const [replies, setReplies] = useState(initialReplies);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Real-time reactions for the main post
    useEffect(() => {
        const channel = pusher.subscribe(`post-${post.id}`);
        channel.bind("reaction-updated", (updatedPost: any) => {
            setPost(updatedPost);
        });

        return () => {
            channel.unbind("reaction-updated");
            pusher.unsubscribe(`post-${post.id}`);
        };
    }, [post.id]);

    const handleNewReply = (newReply: any) => {
        setReplies((prev) => [newReply, ...prev]);
    };

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="flex justify-center flex-1 overflow-hidden">
                <div className="w-full max-w-2xl border-x border-border/50 bg-background/30 flex flex-col h-full">
                    {/* Header */}
                    <div className="px-4 py-3 md:px-6 md:py-4 sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/10 flex items-center gap-3 shrink-0">
                        {isMounted && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-muted-foreground rounded-full bg-accent/50 border-2 border-accent transition-colors duration-200 flex-shrink-0"
                                onClick={() => router.back()}
                                aria-label="Back"
                            >
                                <ChevronLeft strokeWidth="4" className="h-7 w-7" />
                            </Button>
                        )}
                        <h1 className="text-xl font-bold tracking-tight">Thread</h1>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {/* Main Post */}
                        <div className="border-b border-border/10">
                            <PostItem
                                post={post}
                                currentUserId={currentUser?.id}
                                currentUser={currentUser ? {
                                    id: currentUser.id,
                                    username: currentUser.name,
                                    avatar: currentUser.avatar
                                } : undefined}
                                onUpdate={(updated) => {
                                    if (updated.replyToId === post.id) {
                                        handleNewReply(updated);
                                    }
                                }}
                            />
                        </div>

                        {/* Replies List */}
                        <div className="flex flex-col pb-20">
                            {replies.length > 0 ? (
                                replies.map((reply) => (
                                    <PostItem
                                        key={reply.id}
                                        post={reply}
                                        currentUserId={currentUser?.id}
                                        currentUser={currentUser ? {
                                            id: currentUser.id,
                                            username: currentUser.name,
                                            avatar: currentUser.avatar
                                        } : undefined}
                                        onUpdate={() => { }}
                                    />
                                ))
                            ) : (
                                <div className="p-20 text-center opacity-30 select-none">
                                    <p className="text-muted-foreground font-medium italic">Belum ada balasan.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
