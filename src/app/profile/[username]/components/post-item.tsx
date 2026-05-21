"use client";

import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
    MessageSquare,
    Heart,
    Share2,
    Repeat2,
    MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleLikeAction, repostAction } from "../../../posts.action";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { pusher } from "@/lib/pusher/pusher.client";
import { ReplyDialog } from "./reply-dialog";
import { useRouter } from "next/navigation";

interface PostItemProps {
    post: PostWithUserDTO;
    currentUserId?: string;
    currentUser?: {
        id: string;
        username: string;
        avatar: string;
    };
    onUpdate?: (updatedPost: PostWithUserDTO | any) => void;
}

export function PostItem({ post: initialPost, currentUserId, currentUser, onUpdate }: PostItemProps) {
    const [post, setPost] = useState(initialPost);
    const [isLiking, setIsLiking] = useState(false);
    const [isReposting, setIsReposting] = useState(false);
    const [isReplyOpen, setIsReplyOpen] = useState(false);
    const router = useRouter();

    // Sync with external updates
    useEffect(() => {
        setPost(initialPost);
    }, [initialPost]);

    // Real-time reactions
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

    const hasLiked = useMemo(() => {
        return post.reactions?.some(r => r.userId === currentUserId && r.emoji === "❤️");
    }, [post.reactions, currentUserId]);

    const likeCount = useMemo(() => {
        return post.reactions?.filter(r => r.emoji === "❤️").length || 0;
    }, [post.reactions]);

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUserId || isLiking) return;

        const targetId = post.repostOfId || post.id;
        setIsLiking(true);
        try {
            const response = await toggleLikeAction(targetId, currentUserId);
            if (response.status === "error") {
                toast.error(response.error?.message);
            }
        } finally {
            setIsLiking(false);
        }
    };

    const handleRepost = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUserId || isReposting) return;

        const targetId = post.repostOfId || post.id;
        setIsReposting(true);
        try {
            const response = await repostAction(targetId, currentUserId);
            if (response.status === "success") {
                if (response.data === null) {
                    toast.success("Batal membagikan ulang");
                    setPost(prev => ({ ...prev, isRepostedByCurrentUser: false }));
                } else {
                    toast.success("Berhasil membagikan ulang");
                    setPost(prev => ({ ...prev, isRepostedByCurrentUser: true }));
                    if (onUpdate && response.data) onUpdate(response.data);
                }
            } else {
                toast.error(response.error?.message);
            }
        } finally {
            setIsReposting(false);
        }
    };

    const handleReplyClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUser) {
            toast.error("Silakan login untuk membalas");
            return;
        }
        setIsReplyOpen(true);
    };

    const handlePostClick = () => {
        router.push(`/posts/${post.id}`);
    };

    const displayUserInfo = post.repostOf ? post.repostOf.user : post.user;
    const displayContent = post.repostOf ? post.repostOf.content : post.content;
    const createdAt = post.repostOf ? post.repostOf.createdAt : post.createdAt;

    return (
        <div
            onClick={handlePostClick}
            className="flex flex-col border-b border-white/5 hover:bg-white/[0.02] transition-colors group animate-in fade-in duration-500 cursor-pointer"
        >
            {post.repostOf && (
                <div className="flex items-center gap-2 px-6 pt-3 pb-1 text-zinc-500 text-xs font-bold">
                    <Repeat2 className="h-3 w-3" />
                    <span>{post.user.username} membagikan ulang</span>
                </div>
            )}

            <div className={cn("flex gap-4 p-6", post.repostOf ? "pt-3" : "pt-6")}>
                <UserAvatar src={displayUserInfo.avatar || "/avatars/avatar1.png"} className="h-10 w-10 shrink-0" />
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span
                                onClick={(e) => { e.stopPropagation(); router.push(`/profile/${displayUserInfo.username}`) }}
                                className="font-bold text-white truncate hover:underline cursor-pointer"
                            >
                                {displayUserInfo.username}
                            </span>
                            <span className="text-zinc-500 text-sm">·</span>
                            <span className="text-zinc-500 text-sm whitespace-nowrap">
                                {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: id })}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    {post.replyTo && (
                        <div className="text-xs text-zinc-500 mb-1">
                            Membalas <span className="text-primary hover:underline cursor-pointer">@{post.replyTo.user.username}</span>
                        </div>
                    )}

                    <p className="text-[15px] text-zinc-200 leading-relaxed break-words whitespace-pre-wrap">
                        {displayContent}
                    </p>

                    <div className="flex items-center justify-between pt-2 max-sm:gap-4 max-w-sm ml-[-8px]">
                        <InteractionButton
                            icon={MessageSquare}
                            label=""
                            onClick={handleReplyClick}
                        />
                        <InteractionButton
                            icon={Repeat2}
                            label=""
                            onClick={handleRepost}
                            color="hover:text-emerald-500"
                            active={post.isRepostedByCurrentUser || isReposting}
                            activeColor="text-emerald-500"
                        />
                        <InteractionButton
                            icon={Heart}
                            label={likeCount > 0 ? likeCount.toString() : ""}
                            onClick={handleLike}
                            color="hover:text-rose-500"
                            active={hasLiked}
                            activeColor="text-rose-500"
                        />
                        <InteractionButton
                            icon={Share2}
                            label=""
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        />
                    </div>
                </div>
            </div>

            {currentUser && isReplyOpen && (
                <ReplyDialog
                    isOpen={isReplyOpen}
                    onClose={() => setIsReplyOpen(false)}
                    parentPost={post.repostOf || post}
                    currentUser={currentUser}
                    onReplyCreated={(reply) => {
                        if (onUpdate) onUpdate(reply);
                    }}
                />
            )}
        </div>
    );
}

interface InteractionButtonProps {
    icon: any;
    label: string | number;
    onClick: (e: React.MouseEvent) => void;
    color?: string;
    active?: boolean;
    activeColor?: string;
}

function InteractionButton({ icon: Icon, label, onClick, color = "hover:text-white", active, activeColor }: InteractionButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-1 text-zinc-500 transition-all group/btn outline-none",
                active ? (activeColor || "text-white") : color
            )}
        >
            <div className={cn(
                "p-2 rounded-full transition-colors",
                active ? "bg-white/5" : "group-hover/btn:bg-white/5"
            )}>
                <Icon className={cn("h-4 w-4", active && "fill-current")} />
            </div>
            {label && <span className="text-xs font-medium pr-1">{label}</span>}
        </button>
    );
}
