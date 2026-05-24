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
    MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleLikeAction, repostAction } from "../../../posts.action";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { pusher } from "@/lib/pusher/pusher.client";
import { ReplyDialog } from "./reply-dialog";
import { extractUrls } from "@/lib/utils/url";
import { LinkPreviewCard } from "@/app/(with-sidebar)/channels/[roomId]/components/link-preview-card";
import Link from "next/link";
import { createId } from "@paralleldrive/cuid2";

interface PostItemProps {
    post: PostWithUserDTO;
    currentUserId?: string;
    currentUser?: {
        id: string;
        username: string;
        avatar: string;
    };
    isFocused?: boolean;
    hideReplyIndicator?: boolean;
    showConnector?: boolean;
    isLastInChain?: boolean;
    onUpdate?: (updatedPost: PostWithUserDTO | any) => void;
}

export function PostItem({ 
    post: initialPost, 
    currentUserId: explicitUserId, 
    currentUser, 
    isFocused = false, 
    hideReplyIndicator = false, 
    showConnector = false,
    isLastInChain = false,
    onUpdate 
}: PostItemProps) {
    const [post, setPost] = useState(initialPost);
    const [isLiking, setIsLiking] = useState(false);
    const [isReposting, setIsReposting] = useState(false);
    const [isReplyOpen, setIsReplyOpen] = useState(false);

    // Use explicitUserId if provided, otherwise fallback to currentUser.id
    const currentUserId = explicitUserId || currentUser?.id;

    useEffect(() => { setPost(initialPost); }, [initialPost]);

    useEffect(() => {
        const targetId = post.repostOfId || post.id;
        const channel = pusher.subscribe(`post-${targetId}`);
        channel.bind("reaction-updated", (updatedPost: PostWithUserDTO) => {
            setPost(prev => ({
                ...prev,
                reactions: updatedPost.reactions,
                repostCount: updatedPost.repostCount,
                replyCount: updatedPost.replyCount,
                isRepostedByCurrentUser: updatedPost.isRepostedByCurrentUser ?? prev.isRepostedByCurrentUser,
            }));
        });
        return () => { channel.unbind_all(); pusher.unsubscribe(`post-${targetId}`); };
    }, [post.id, post.repostOfId]);

    const hasLiked = useMemo(() => post.reactions?.some(r => r.userId === currentUserId && r.emoji === "❤️"), [post.reactions, currentUserId]);
    const likeCount = useMemo(() => post.reactions?.filter(r => r.emoji === "❤️").length || 0, [post.reactions]);

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!currentUserId || isLiking) return;

        const targetId = post.repostOfId || post.id;
        const optimisticId = createId();
        setIsLiking(true);

        try {
            const response = await toggleLikeAction(targetId, currentUserId, optimisticId);
            if (response.data) setPost(prev => ({ ...prev, ...response.data }));
        } catch (err) { toast.error("Gagal menyukai"); } finally { setIsLiking(false); }
    };

    const handleRepost = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!currentUserId || isReposting) return;

        const targetId = post.repostOfId || post.id;
        const optimisticId = createId();
        setIsReposting(true);

        try {
            const response = await repostAction(targetId, currentUserId, optimisticId);
            if (response.status === "success") {
                if (response.data) {
                    setPost(prev => ({ ...prev, ...response.data }));
                    if (onUpdate) onUpdate(response.data);
                } else {
                    setPost(prev => ({ ...prev, isRepostedByCurrentUser: false, repostCount: Math.max(0, (prev.repostCount || 0) - 1) }));
                }
            }
        } catch (err) { toast.error("Gagal membagikan"); } finally { setIsReposting(false); }
    };

    const handleCopyLink = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
        toast.success("Tautan disalin!");
    };

    const displayUserInfo = post.repostOf ? post.repostOf.user : post.user;
    const displayContent = post.repostOf ? post.repostOf.content : post.content;
    const createdAt = post.repostOf ? post.repostOf.createdAt : post.createdAt;
    const urls = useMemo(() => extractUrls(displayContent), [displayContent]);

    // Format date for focused view: 12:30 PM · May 24, 2024
    const formattedDate = useMemo(() => {
        const d = new Date(createdAt);
        return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " · " + 
               d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    }, [createdAt]);

    if (isFocused) {
        return (
            <div className="relative border-b border-white/5 bg-background transition-colors duration-200">
                <div className="relative z-10 flex flex-col pt-4 pb-1 px-4 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Link href={`/profile/${displayUserInfo.username}`} className="hover:opacity-80 block" onClick={(e) => e.stopPropagation()}>
                                <UserAvatar src={displayUserInfo.avatar || "/avatars/avatar1.png"} className="h-12 w-12" />
                            </Link>
                            <div className="flex flex-col">
                                <Link href={`/profile/${displayUserInfo.username}`} className="font-bold text-[16px] text-zinc-100 hover:underline leading-tight" onClick={(e) => e.stopPropagation()}>
                                    {displayUserInfo.username}
                                </Link>
                                <span className="text-zinc-500 text-[14px]">@{displayUserInfo.username.toLowerCase()}</span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 rounded-full hover:bg-white/5 transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </div>

                    {!hideReplyIndicator && post.replyToId && (
                        <div className="text-[15px] text-zinc-500 mb-3">
                            {post.replyTo ? (
                                <>Membalas <Link href={`/profile/${post.replyTo.user.username}`} className="text-sky-500 hover:underline" onClick={(e) => e.stopPropagation()}>@{post.replyTo.user.username}</Link></>
                            ) : <span className="italic opacity-60">Membalas postingan yang telah dihapus</span>}
                        </div>
                    )}

                    <p className="text-[20px] text-zinc-100 leading-normal mb-4 whitespace-pre-wrap">{displayContent}</p>
                    
                    {urls.length > 0 && <div className="mb-4 space-y-2">{urls.map((url) => <div key={url} onClick={(e) => e.stopPropagation()}><LinkPreviewCard url={url} /></div>)}</div>}

                    <div className="py-4 border-y border-white/5 flex flex-col gap-4">
                        <div className="text-zinc-500 text-[15px]">
                            {formattedDate}
                        </div>
                        {(likeCount > 0 || (post.repostCount ?? 0) > 0) && (
                            <div className="flex gap-4 text-[15px] border-t border-white/5 pt-4">
                                {(post.repostCount ?? 0) > 0 && (
                                    <div className="flex gap-1 items-center">
                                        <span className="font-bold text-zinc-100">{post.repostCount}</span>
                                        <span className="text-zinc-500">Reposts</span>
                                    </div>
                                )}
                                {likeCount > 0 && (
                                    <div className="flex gap-1 items-center">
                                        <span className="font-bold text-zinc-100">{likeCount}</span>
                                        <span className="text-zinc-500">Likes</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-around py-1 border-b border-white/5 w-full">
                        <InteractionButton 
                            icon={MessageSquare} 
                            onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIsReplyOpen(true); }} 
                            hoverColor="hover:text-sky-400" 
                            hoverBg="group-hover/btn:bg-sky-500/10" 
                        />
                        <InteractionButton icon={Repeat2} onClick={handleRepost} hoverColor="hover:text-emerald-500" hoverBg="group-hover/btn:bg-emerald-500/10" active={post.isRepostedByCurrentUser} activeColor="text-emerald-500" activeBg="bg-emerald-500/10" />
                        <InteractionButton icon={Heart} onClick={handleLike} hoverColor="hover:text-rose-500" hoverBg="group-hover/btn:bg-rose-500/10" active={hasLiked} activeColor="text-rose-500" activeBg="bg-rose-500/10" fillActive />
                        <InteractionButton icon={Share2} onClick={handleCopyLink} hoverColor="hover:text-sky-400" hoverBg="group-hover/btn:bg-sky-500/10" />
                    </div>
                </div>
                {currentUser && isReplyOpen && <ReplyDialog isOpen={isReplyOpen} onClose={() => setIsReplyOpen(false)} parentPost={post.repostOf || post} currentUser={currentUser} onReplyCreated={(reply) => { if (onUpdate) onUpdate(reply); }} />}
            </div>
        );
    }

    return (
        <div className={cn("relative border-b border-white/5 transition-colors duration-200 hover:bg-white/[0.01]")}>
            {/* Thread Connector Line */}
            {showConnector && (
                <div 
                    className={cn(
                        "absolute left-[39px] w-[2px] bg-zinc-800 z-0",
                        isLastInChain ? "top-0 h-4" : "top-0 bottom-0"
                    )} 
                />
            )}

            <div className="relative z-10 flex gap-3 pt-4 pb-3 px-4 animate-in fade-in duration-300">
                <div className="shrink-0 z-20 relative">
                    <Link href={`/profile/${displayUserInfo.username}`} className="hover:opacity-80 block" onClick={(e) => e.stopPropagation()}>
                        <UserAvatar src={displayUserInfo.avatar || "/avatars/avatar1.png"} className="h-10 w-10" />
                    </Link>
                </div>
                
                <div className="flex-1 min-w-0">
                    <Link href={`/posts/${post.id}`} className="block group/content outline-none">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 z-20">
                                <Link href={`/profile/${displayUserInfo.username}`} className="font-bold text-[15px] text-zinc-100 hover:underline" onClick={(e) => e.stopPropagation()}>
                                    {displayUserInfo.username}
                                </Link>
                                <span className="text-zinc-500 text-sm">·</span>
                                <span className="text-zinc-500 text-sm hover:underline">
                                    {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: id })}
                                </span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 z-20 text-zinc-500 rounded-full hover:bg-white/5 transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                        {post.repostOf && (
                            <div className="mb-1 text-zinc-500 text-[13px] font-medium z-20">
                                <Repeat2 className="h-4 w-4 inline mr-1" />
                                <Link href={`/profile/${post.user.username}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                                    {post.user.username === currentUser?.username ? "Anda" : post.user.username} membagikan ulang
                                </Link>
                            </div>
                        )}
                        {!hideReplyIndicator && post.replyToId && !showConnector && (
                            <div className="text-[14px] text-zinc-500 mb-1 z-20">
                                {post.replyTo ? (
                                    <>Membalas <Link href={`/profile/${post.replyTo.user.username}`} className="text-sky-500 hover:underline" onClick={(e) => e.stopPropagation()}>@{post.replyTo.user.username}</Link></>
                                ) : <span className="italic opacity-60">Membalas postingan yang telah dihapus</span>}
                            </div>
                        )}
                        <p className="text-[15px] text-zinc-100 leading-normal">{displayContent}</p>
                    </Link>

                    {urls.length > 0 && <div className="mt-3 z-20 space-y-2">{urls.map((url) => <div key={url} onClick={(e) => e.stopPropagation()}><LinkPreviewCard url={url} /></div>)}</div>}
                    
                    <div className="flex items-center justify-between mt-3 max-w-[400px] w-full z-20">
                        <InteractionButton 
                            icon={MessageSquare} 
                            label={post.replyCount || ""} 
                            onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIsReplyOpen(true); }} 
                            hoverColor="hover:text-sky-400" 
                            hoverBg="group-hover/btn:bg-sky-500/10" 
                        />
                        <InteractionButton icon={Repeat2} label={post.repostCount || ""} onClick={handleRepost} hoverColor="hover:text-emerald-500" hoverBg="group-hover/btn:bg-emerald-500/10" active={post.isRepostedByCurrentUser} activeColor="text-emerald-500" activeBg="bg-emerald-500/10" />
                        <InteractionButton icon={Heart} label={likeCount || ""} onClick={handleLike} hoverColor="hover:text-rose-500" hoverBg="group-hover/btn:bg-rose-500/10" active={hasLiked} activeColor="text-rose-500" activeBg="bg-rose-500/10" fillActive />
                        <InteractionButton icon={Share2} onClick={handleCopyLink} hoverColor="hover:text-sky-400" hoverBg="group-hover/btn:bg-sky-500/10" />
                    </div>
                </div>
            </div>
            {currentUser && isReplyOpen && <ReplyDialog isOpen={isReplyOpen} onClose={() => setIsReplyOpen(false)} parentPost={post.repostOf || post} currentUser={currentUser} onReplyCreated={(reply) => { if (onUpdate) onUpdate(reply); }} />}
        </div>
    );
}

interface InteractionButtonProps {
    icon: any;
    label?: string | number;
    onClick: (e: React.MouseEvent) => void;
    hoverColor?: string;
    hoverBg?: string;
    active?: boolean;
    activeColor?: string;
    activeBg?: string;
    fillActive?: boolean;
}

function InteractionButton({ 
    icon: Icon, 
    label, 
    onClick, 
    hoverColor = "hover:text-white", 
    hoverBg = "group-hover/btn:bg-white/5", 
    active, 
    activeColor, 
    activeBg, 
    fillActive 
}: InteractionButtonProps) {
    return (
        <button onClick={onClick} className={cn("flex items-center gap-1.5 text-zinc-500 transition-all group/btn outline-none min-w-[60px]", active ? (activeColor || "text-white") : hoverColor)}>
            <div className={cn("p-1.5 rounded-full transition-colors flex items-center justify-center", active ? (activeBg || "bg-white/5") : hoverBg)}>
                <Icon className={cn("h-[18px] w-[18px]", active && fillActive && "fill-current")} />
            </div>
            {label !== undefined && label !== "" && <span className="text-[13px] font-medium">{label}</span>}
        </button>
    );
}
