"use client";

import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { useState, useEffect, useRef } from "react";
import { PostItem } from "@/app/profile/[username]/components/post-item";
import { SimpleReplyInput } from "@/app/profile/[username]/components/simple-reply-input";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { pusher } from "@/lib/pusher/pusher.client";
import { cn } from "@/lib/utils";

interface PostDetailViewProps {
    initialPost: PostWithUserDTO;
    initialReplies: PostWithUserDTO[];
    initialParents: PostWithUserDTO[];
    currentUser: any;
}

export default function PostDetailView({ initialPost, initialReplies, initialParents, currentUser }: PostDetailViewProps) {
    const [post, setPost] = useState(initialPost);
    const [replies, setReplies] = useState(initialReplies);
    const [parents] = useState(initialParents);
    const [pendingReplies, setPendingReplies] = useState<PostWithUserDTO[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();
    
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

    useEffect(() => {
        const channel = pusher.subscribe(`post-${post.id}`);
        
        channel.bind("reaction-updated", (updatedPost: any) => setPost(updatedPost));
        channel.bind("new-reply", (newReply: PostWithUserDTO) => {
            if (newReply.userId === currentUser?.id) return;
            handleNewReplyCreated(newReply);
        });

        return () => { channel.unbind_all(); pusher.unsubscribe(`post-${post.id}`); };
    }, [post.id, currentUser?.id]);

    const handleShowPending = () => {
        setReplies((prev) => [...pendingReplies, ...prev]);
        setPendingReplies([]);
    };

    const handleNewReplyCreated = (newReply: any) => {
        setReplies((prev) => {
            if (prev.some(r => r.id === newReply.id)) return prev;
            return [newReply, ...prev];
        });
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
                        {/* Parent Chain - Thread Reveal Behavior */}
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
                                    />
                                ))}
                            </div>
                        )}

                        {/* 
                            SMART CONTAINER 
                            Dimulai dari Postingan Fokus hingga akhir halaman.
                            min-h menggunakan calc(100vh - 60px) agar presisi.
                        */}
                        <div className="min-h-[calc(100vh-60px)] flex flex-col bg-background">
                            
                            {/* Main Focused Post (The Anchor) */}
                            <div 
                                ref={focusedPostRef}
                                id={`post-${post.id}`} 
                                className="relative scroll-mt-[60px]" 
                            >
                                {parents.length > 0 && (
                                    <div className="absolute left-[39px] top-0 h-4 w-[2px] bg-zinc-800 z-0" />
                                )}
                                <PostItem 
                                    post={post} 
                                    currentUser={currentUser} 
                                    isFocused={true} 
                                    onUpdate={handleNewReplyCreated}
                                />
                            </div>

                            {/* Inline Reply Input */}
                            {currentUser && (
                                <SimpleReplyInput 
                                    currentUser={currentUser} 
                                    postId={post.id}
                                    onReplyCreated={handleNewReplyCreated} 
                                />
                            )}

                            {/* Pending Replies */}
                            {pendingReplies.length > 0 && (
                                <div className="sticky top-16 left-0 right-0 z-20 flex justify-center py-2">
                                    <Button onClick={handleShowPending} className="bg-sky-500 text-white rounded-full shadow-lg px-4 py-1.5 text-sm font-bold h-9">
                                        {pendingReplies.length} Balasan Baru
                                    </Button>
                                </div>
                            )}

                            {/* Replies List */}
                            <div className="flex flex-col pb-20">
                                {replies.length > 0 ? (
                                    replies.map((reply) => (
                                        <PostItem 
                                            key={reply.id} 
                                            post={reply} 
                                            hideReplyIndicator={true} 
                                            currentUser={currentUser} 
                                            onUpdate={handleNewReplyCreated} 
                                        />
                                    ))
                                ) : (
                                    <div className="p-10 text-center text-zinc-500 text-sm italic border-t border-border/10">Belum ada balasan.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
