"use client";

import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { useState, useEffect, useRef } from "react";
import { PostInput } from "@/app/profile/[username]/components/post-input";
import { PostItem } from "@/app/profile/[username]/components/post-item";
import { getNewPostsAction } from "@/app/posts.action";
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
    const [pendingPosts, setPendingPosts] = useState<PostWithUserDTO[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Lazy Fetch: Polling for new posts every 60 seconds
    useEffect(() => {
        if (!posts[0]?.id) return;

        const checkForNewPosts = async () => {
            try {
                const response = await getNewPostsAction(posts[0].id, currentUser?.id);
                if (response.status === "success" && response.data && response.data.length > 0) {
                    setPendingPosts((prev) => {
                        const newPosts = response.data!.filter(
                            np => !posts.some(p => p.id === np.id) && !prev.some(p => p.id === np.id)
                        );
                        return [...newPosts, ...prev];
                    });
                }
            } catch (err) {
                console.error("Failed to check for new posts", err);
            }
        };

        const interval = setInterval(checkForNewPosts, 60000); // 1 minute
        return () => clearInterval(interval);
    }, [posts, currentUser?.id]);

    const handleShowPending = () => {
        setPosts((prev) => [...pendingPosts, ...prev]);
        setPendingPosts([]);
        
        // Scroll to top
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handlePostCreated = (newPost: any) => {
        // Only add if not already in list
        setPosts((prev) => {
            if (prev.some(p => p.id === newPost.id)) return prev;
            return [newPost, ...prev];
        });
        
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="flex justify-center flex-1 overflow-hidden">
                <div className="w-full max-w-2xl border-x border-border/50 bg-background/30 flex flex-col h-full relative">
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

                    <div 
                        ref={scrollContainerRef}
                        className="flex-1 overflow-y-auto custom-scrollbar relative"
                    >
                        {pendingPosts.length > 0 && (
                            <div className="sticky top-4 left-0 right-0 z-20 flex justify-center pointer-events-none">
                                <Button
                                    onClick={handleShowPending}
                                    className="pointer-events-auto bg-primary text-primary-foreground rounded-full shadow-lg px-4 py-2 text-sm font-bold animate-in slide-in-from-top-4 duration-300"
                                >
                                    {pendingPosts.length} Postingan Baru
                                </Button>
                            </div>
                        )}

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
