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
    PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleLikeAction, repostAction } from "../../../posts.action";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { extractUrls } from "@/lib/extract-urls";
import { toast } from "sonner";
import { ReplyDialog } from "./reply-dialog";
import { QuoteDialog } from "./quote-dialog";
import { LinkPreviewCard } from "@/app/(with-sidebar)/channels/[roomId]/components/link-preview-card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createId } from "@paralleldrive/cuid2";
import { optimisticPostRepository } from "@/lib/infrastructure/optimistic-post.repository";
import { useQueryClient } from "@tanstack/react-query";

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
    post,
    currentUserId: explicitUserId,
    currentUser,
    isFocused = false,
    hideReplyIndicator = false,
    showConnector = false,
    isLastInChain = false,
    onUpdate
}: PostItemProps) {
    const queryClient = useQueryClient();
    const [isLiking, setIsLiking] = useState(false);
    const [isReposting, setIsReposting] = useState(false);
    const [isReplyOpen, setIsReplyOpen] = useState(false);
    const [isQuoteOpen, setIsQuoteOpen] = useState(false);
    const [isOptimisticDeleted, setIsOptimisticDeleted] = useState(false);
    const router = useRouter();

    const currentUserId = explicitUserId || currentUser?.id;

    // Memoized states derived from props to ensure 100% sync
    const hasLiked = useMemo(() => post.reactions?.some(r => r.userId === currentUserId && r.emoji === "❤️"), [post.reactions, currentUserId]);
    const likeCount = useMemo(() => post.reactions?.filter(r => r.emoji === "❤️").length || 0, [post.reactions]);
    const isQuotePost = !!post.repostOf && post.content !== "";
    const isPureRepost = !!post.repostOf && post.content === "";

    const displayUserInfo = isPureRepost && post.repostOf ? post.repostOf.user : post.user;
    const displayContent = isPureRepost && post.repostOf ? post.repostOf.content : post.content;
    const createdAt = isPureRepost && post.repostOf ? post.repostOf.createdAt : post.createdAt;

    const urls = useMemo(() => extractUrls(displayContent), [displayContent]);

    const formattedDate = useMemo(() => {
        const d = new Date(createdAt);
        return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " · " +
            d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    }, [createdAt]);

    const updateGlobalCache = (updatedData: Partial<PostWithUserDTO>) => {
        const targetId = post.repostOfId || post.id;

        // Pattern matching to update ALL post-related queries (feed, profile, following, search, etc.)
        queryClient.setQueriesData({ queryKey: [] }, (old: any) => {
            // If it's an array (list of posts like feed/profile)
            if (Array.isArray(old)) {
                return old.map((p: PostWithUserDTO) => {
                    if (p.id === targetId) return { ...p, ...updatedData };
                    if (p.repostOfId === targetId) return { ...p, repostOf: p.repostOf ? { ...p.repostOf, ...updatedData } : p.repostOf };
                    return p;
                });
            }

            // If it's a single object (like Post Detail)
            if (old && typeof old === "object" && (old.id === targetId || old.repostOfId === targetId)) {
                if (old.id === targetId) return { ...old, ...updatedData };
                return { ...old, repostOf: old.repostOf ? { ...old.repostOf, ...updatedData } : old.repostOf };
            }

            return old;
        });

        if (onUpdate) onUpdate({ ...post, ...updatedData });
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!currentUserId || isLiking) return;

        const targetId = post.repostOfId || post.id;
        const optimisticId = createId();
        setIsLiking(true);

        const newReactions = hasLiked
            ? (post.reactions || []).filter(r => !(r.userId === currentUserId && r.emoji === "❤️"))
            : [...(post.reactions || []), { userId: currentUserId, emoji: "❤️", createdAt: new Date() }];

        updateGlobalCache({ reactions: newReactions as any });

        try {
            const response = await toggleLikeAction(targetId, currentUserId, optimisticId);
            if (response.data) updateGlobalCache(response.data);
        } catch (err) {
            toast.error("Gagal menyukai");
        } finally { setIsLiking(false); }
    };

    const handleRepost = async (e?: React.MouseEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!currentUserId || isReposting) return;

        const targetId = post.repostOfId || post.id;
        const optimisticId = createId();
        setIsReposting(true);

        const wasReposted = post.isRepostedByCurrentUser;

        // Optimistic UI interaction
        if (wasReposted && isPureRepost) {
            setIsOptimisticDeleted(true);
        }

        const updatedFields = {
            isRepostedByCurrentUser: !wasReposted,
            repostCount: Math.max(0, (post.repostCount || 0) + (wasReposted ? -1 : 1))
        };

        updateGlobalCache(updatedFields);

        try {
            const response = await repostAction(targetId, currentUserId, optimisticId);

            if (response.status === "success") {
                const updatedPost = response.data;
                if (updatedPost) {
                    // It was a REPOST: Save to local DB and MANUALLY insert into cache list
                    await optimisticPostRepository.savePendingPost({
                        ...updatedPost,
                        optimisticId
                    } as PostWithUserDTO);

                    // Optimistically insert into the list to prevent flicker
                    queryClient.setQueriesData({ queryKey: ["feed"] }, (old: any) => {
                        if (!old) return [updatedPost];
                        if (old.some((item: any) => item.id === updatedPost.id)) return old;
                        return [updatedPost, ...old];
                    });

                    // Invalidate all feed-related queries to ensure data consistency everywhere
                    queryClient.invalidateQueries({ queryKey: ["feed"] });
                    queryClient.invalidateQueries({ queryKey: ["user-posts"] });
                    queryClient.invalidateQueries({ queryKey: ["following-feed"] });
                    queryClient.invalidateQueries({ queryKey: ["post"] });
                    updateGlobalCache(updatedPost);
                } else {
                    // This was an UNREPOST
                    if (isPureRepost) {
                        setIsOptimisticDeleted(true);
                    }

                    // Manually remove from cache to prevent flicker
                    queryClient.setQueriesData({ queryKey: [] }, (old: any) => {
                        if (Array.isArray(old)) {
                            return old.filter((item: any) => item.id !== post.id && item.repostOfId !== post.id);
                        }
                        return old;
                    });

                    queryClient.invalidateQueries({ queryKey: ["feed"] });
                    queryClient.invalidateQueries({ queryKey: ["user-posts"] });
                    queryClient.invalidateQueries({ queryKey: ["following-feed"] });
                    queryClient.invalidateQueries({ queryKey: ["post"] });

                    // Ensure original item count is updated
                    updateGlobalCache({
                        isRepostedByCurrentUser: false,
                        repostCount: Math.max(0, (post.repostCount || 0) - 1)
                    });
                }
            } else {
                setIsOptimisticDeleted(false);
                updateGlobalCache({
                    isRepostedByCurrentUser: wasReposted,
                    repostCount: post.repostCount
                });
                toast.error("Gagal membagikan");
            }
        } catch (err) {
            setIsOptimisticDeleted(false);
            updateGlobalCache({
                isRepostedByCurrentUser: wasReposted,
                repostCount: post.repostCount
            });
            toast.error("Gagal membagikan");
        } finally {
            setIsReposting(false);
        }
    };

    const handleCopyLink = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
        toast.success("Tautan disalin!");
    };

    const renderQuotedPost = (quotedPost: PostWithUserDTO) => (
        <div
            onClick={(e) => {
                e.stopPropagation();
                router.push(`/posts/${quotedPost.id}`);
            }}
            className="mt-3 border border-white/10 rounded-2xl p-3 flex flex-col gap-1.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors overflow-hidden cursor-pointer"
        >
            <div className="flex items-center gap-1.5">
                <div onClick={(e) => { e.stopPropagation(); router.push(`/profile/${quotedPost.user.username}`); }}>
                    <UserAvatar src={quotedPost.user.avatar || "/avatars/avatar1.png"} className="h-4 w-4 shrink-0 hover:opacity-80" />
                </div>
                <span
                    onClick={(e) => { e.stopPropagation(); router.push(`/profile/${quotedPost.user.username}`); }}
                    className="font-bold text-white text-[14px] truncate hover:underline"
                >
                    {quotedPost.user.username}
                </span>
                <span className="text-zinc-500 text-[13px]">·</span>
                <span className="text-zinc-500 text-[13px] whitespace-nowrap">
                    {formatDistanceToNow(new Date(quotedPost.createdAt), { addSuffix: true, locale: id })}
                </span>
            </div>
            <p className="text-zinc-300 text-[14px] line-clamp-3 leading-normal">{quotedPost.content}</p>
        </div>
    );

    if (isOptimisticDeleted) return null;

    if (isFocused) {
        return (
            <div className="relative border-b border-white/5 bg-background transition-colors duration-200">
                <div className="relative z-10 flex flex-col pt-4 pb-1 px-4 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Link href={`/profile/${displayUserInfo.username}`} className="hover:opacity-80 block relative z-30" onClick={(e) => e.stopPropagation()}>
                                <UserAvatar src={displayUserInfo.avatar || "/avatars/avatar1.png"} className="h-12 w-12" />
                            </Link>
                            <div className="flex flex-col">
                                <Link href={`/profile/${displayUserInfo.username}`} className="font-bold text-[16px] text-zinc-100 hover:underline leading-tight relative z-30" onClick={(e) => e.stopPropagation()}>
                                    {displayUserInfo.username}
                                </Link>
                                <span className="text-zinc-500 text-[14px]">@{displayUserInfo.username.toLowerCase()}</span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 rounded-full hover:bg-white/5 transition-colors relative z-30" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </div>

                    {!hideReplyIndicator && post.replyToId && (
                        <div className="text-[15px] text-zinc-500 mb-3 relative z-30">
                            {post.replyTo ? (
                                <>Membalas <Link href={`/profile/${post.replyTo.user.username}`} className="text-sky-500 hover:underline" onClick={(e) => e.stopPropagation()}>@{post.replyTo.user.username}</Link></>
                            ) : <span className="italic opacity-60">Membalas postingan yang telah dihapus</span>}
                        </div>
                    )}

                    <p className="text-[20px] text-zinc-100 leading-normal mb-4 whitespace-pre-wrap">{displayContent}</p>

                    {isQuotePost && post.repostOf && renderQuotedPost(post.repostOf)}

                    {urls.length > 0 && <div className="my-4 space-y-2">{urls.map((url) => <div key={url} onClick={(e) => e.stopPropagation()} className="relative z-30"><LinkPreviewCard url={url} /></div>)}</div>}

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

                    <div className="flex items-center justify-around py-1 w-full relative z-30">
                        <InteractionButton
                            icon={MessageSquare}
                            onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIsReplyOpen(true); }}
                            hoverColor="hover:text-sky-400"
                            hoverBg="group-hover/btn:bg-sky-500/10"
                        />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <InteractionButton
                                        icon={Repeat2}
                                        onClick={(e) => e.preventDefault()}
                                        hoverColor="hover:text-emerald-500"
                                        hoverBg="group-hover/btn:bg-emerald-500/10"
                                        active={post.isRepostedByCurrentUser}
                                        activeColor="text-emerald-500"
                                        activeBg="bg-transparent"
                                    />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-zinc-900 border-white/10 text-zinc-100 z-[100]">
                                <DropdownMenuItem onClick={handleRepost} className="cursor-pointer focus:bg-white/5 focus:text-emerald-500">
                                    <Repeat2 className="mr-2 h-4 w-4" />
                                    <span>{post.isRepostedByCurrentUser ? "Batalkan Repost" : "Repost"}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsQuoteOpen(true); }} className="cursor-pointer focus:bg-white/5 focus:text-emerald-500">
                                    <PenLine className="mr-2 h-4 w-4" />
                                    <span>Quote</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <InteractionButton icon={Heart} onClick={handleLike} hoverColor="hover:text-rose-500" hoverBg="group-hover/btn:bg-rose-500/10" active={hasLiked} activeColor="text-rose-500" activeBg="bg-transparent" fillActive />
                        <InteractionButton icon={Share2} onClick={handleCopyLink} hoverColor="hover:text-sky-400" hoverBg="group-hover/btn:bg-sky-500/10" />
                    </div>
                </div>
                {currentUser && isReplyOpen && <ReplyDialog isOpen={isReplyOpen} onClose={() => setIsReplyOpen(false)} parentPost={post.repostOf || post} currentUser={currentUser} onReplyCreated={(reply: any) => { if (onUpdate) onUpdate(reply); }} />}
                {currentUser && isQuoteOpen && <QuoteDialog isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} targetPost={post.repostOf || post} currentUser={currentUser} onQuoteCreated={(quote: any) => { if (onUpdate) onUpdate(quote); }} />}
            </div>
        );
    }

    return (
        <div className={cn("relative border-b border-white/5 transition-colors duration-200 hover:bg-white/[0.01] overflow-hidden")}>
            <Link href={`/posts/${post.id}`} className="absolute inset-0 z-10 opacity-0" aria-label="View post" />

            {showConnector && (
                <div className={cn("absolute left-[39px] w-[2px] bg-zinc-800 z-0", isLastInChain ? "top-0 h-4" : "top-0 bottom-0")} />
            )}

            <div className="relative z-20 flex gap-3 pt-4 pb-3 px-4 pointer-events-none">
                <div className="shrink-0 z-30 relative pointer-events-auto">
                    <Link href={`/profile/${displayUserInfo.username}`} className="hover:opacity-80 block" onClick={(e) => e.stopPropagation()}>
                        <UserAvatar src={displayUserInfo.avatar || "/avatars/avatar1.png"} className="h-10 w-10" />
                    </Link>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="block group/content outline-none">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 z-30 relative pointer-events-auto">
                                <Link href={`/profile/${displayUserInfo.username}`} className="font-bold text-[15px] text-zinc-100 hover:underline" onClick={(e) => e.stopPropagation()}>
                                    {displayUserInfo.username}
                                </Link>
                                <span className="text-zinc-500 text-sm">·</span>
                                <span className="text-zinc-500 text-sm hover:underline">
                                    {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: id })}
                                </span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 z-30 text-zinc-500 rounded-full hover:bg-white/5 transition-colors relative pointer-events-auto" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                        {isPureRepost && (
                            <div className="mb-1 text-zinc-500 text-[13px] font-medium z-30 relative pointer-events-auto">
                                <Repeat2 className="h-4 w-4 inline mr-1" />
                                <Link href={`/profile/${post.user.username}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                                    {post.user.username === currentUser?.username ? "Anda" : post.user.username} membagikan ulang
                                </Link>
                            </div>
                        )}
                        {!hideReplyIndicator && post.replyToId && !showConnector && (
                            <div className="text-[14px] text-zinc-500 mb-1 z-30 relative pointer-events-auto">
                                {post.replyTo ? (
                                    <>Membalas <Link href={`/profile/${post.replyTo.user.username}`} className="text-sky-500 hover:underline" onClick={(e) => e.stopPropagation()}>@{post.replyTo.user.username}</Link></>
                                ) : <span className="italic opacity-60">Membalas postingan yang telah dihapus</span>}
                            </div>
                        )}
                        <p className="text-[15px] text-zinc-100 leading-normal pointer-events-auto">{displayContent}</p>
                    </div>

                    {isQuotePost && post.repostOf && <div className="pointer-events-auto relative z-30">{renderQuotedPost(post.repostOf)}</div>}

                    {urls.length > 0 && <div className="mt-3 z-30 space-y-2 relative pointer-events-auto">{urls.map((url) => <div key={url} onClick={(e) => e.stopPropagation()}><LinkPreviewCard url={url} /></div>)}</div>}

                    <div className="flex items-center justify-between mt-3 max-w-[400px] w-full z-30 relative pointer-events-auto">
                        <InteractionButton
                            icon={MessageSquare}
                            label={post.replyCount || ""}
                            onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIsReplyOpen(true); }}
                            hoverColor="hover:text-sky-400"
                            hoverBg="group-hover/btn:bg-sky-500/10"
                        />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <InteractionButton
                                        icon={Repeat2}
                                        label={post.repostCount || ""}
                                        onClick={(e) => e.preventDefault()}
                                        hoverColor="hover:text-emerald-500"
                                        hoverBg="group-hover/btn:bg-emerald-500/10"
                                        active={post.isRepostedByCurrentUser}
                                        activeColor="text-emerald-500"
                                        activeBg="bg-transparent"
                                    />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-zinc-900 border-white/10 text-zinc-100 z-[100]">
                                <DropdownMenuItem onClick={handleRepost} className="cursor-pointer focus:bg-white/5 focus:text-emerald-500">
                                    <Repeat2 className="mr-2 h-4 w-4" />
                                    <span>{post.isRepostedByCurrentUser ? "Batalkan Repost" : "Repost"}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsQuoteOpen(true); }} className="cursor-pointer focus:bg-white/5 focus:text-emerald-500">
                                    <PenLine className="mr-2 h-4 w-4" />
                                    <span>Quote</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <InteractionButton icon={Heart} label={likeCount || ""} onClick={handleLike} hoverColor="hover:text-rose-500" hoverBg="group-hover/btn:bg-rose-500/10" active={hasLiked} activeColor="text-rose-500" activeBg="bg-transparent" fillActive />
                        <InteractionButton icon={Share2} onClick={handleCopyLink} hoverColor="hover:text-sky-400" hoverBg="group-hover/btn:bg-sky-500/10" />
                    </div>
                </div>
            </div>
            {currentUser && isReplyOpen && <ReplyDialog isOpen={isReplyOpen} onClose={() => setIsReplyOpen(false)} parentPost={post.repostOf || post} currentUser={currentUser} onReplyCreated={(reply: any) => { if (onUpdate) onUpdate(reply); }} />}
            {currentUser && isQuoteOpen && <QuoteDialog isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} targetPost={post.repostOf || post} currentUser={currentUser} onQuoteCreated={(quote: any) => { if (onUpdate) onUpdate(quote); }} />}
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
