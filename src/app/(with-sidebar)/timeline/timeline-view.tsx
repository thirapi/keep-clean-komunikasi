"use client";

import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { useState, useEffect } from "react";
import { PostInput } from "@/app/profile/[username]/components/post-input";
import { PostItem } from "@/app/profile/[username]/components/post-item";
import { pusher } from "@/lib/pusher/pusher.client";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface TimelineViewProps {
    initialPosts: PostWithUserDTO[];
    currentUser: any;
    title?: string;
}

export default function TimelineView({ initialPosts, currentUser, title = "Timeline" }: TimelineViewProps) {
    const [posts, setPosts] = useState(initialPosts);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const channel = pusher.subscribe("global-feed");
        channel.bind("new-post", (newPost: any) => {
            setPosts((prev) => {
                if (prev.some(p => p.id === newPost.id)) return prev;
                return [newPost, ...prev];
            });
        });

        return () => {
            channel.unbind("new-post");
            pusher.unsubscribe("global-feed");
        };
    }, []);

    const handlePostCreated = (newPost: any) => {
        setPosts((prev) => [newPost, ...prev]);
    };

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="flex justify-center flex-1 overflow-hidden">
                <div className="w-full max-w-2xl border-x border-border/50 bg-background/30 flex flex-col h-full">
                    <div className="px-4 py-3 md:px-6 md:py-4 sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/10 flex items-center gap-3 shrink-0">
                        {isMounted && (
                            <div className="md:hidden">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                    className="h-10 w-10 text-muted-foreground rounded-full bg-accent/50 border-2 border-accent transition-colors duration-200 flex-shrink-0"
                                    aria-label="Kembali"
                                >
                                    <Link href={currentUser ? "/channels/default" : "/discovery"}>
                                        <ChevronLeft strokeWidth="4" className="h-7 w-7" />
                                    </Link>
                                </Button>
                            </div>
                        )}
                        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {currentUser && (
                            <div className="border-b border-border/10 bg-background/20 backdrop-blur-sm">
                                <PostInput
                                    currentUser={currentUser}
                                    onPostCreated={handlePostCreated}
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
                                        onUpdate={handlePostCreated}
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
