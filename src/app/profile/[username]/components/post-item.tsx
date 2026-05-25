"use client";

import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PostMedia } from "./post-media";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
    MessageSquare,
    Heart,
    Share2,
    Repeat2,
    MoreHorizontal,
    PenLine,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toggleLikeAction, repostAction, deletePostAction } from "../../../posts.action";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { extractUrls } from "@/lib/extract-urls";
import { toast } from "sonner";
import { ReplyDialog } from "./reply-dialog";
import { QuoteDialog } from "./quote-dialog";
import { LinkPreviewCard } from "@/app/(with-sidebar)/channels/[roomId]/components/link-preview-card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageSource } from "@/components/ui/image-lightbox";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    const router = useRouter();
    const [isReplyOpen, setIsReplyOpen] = useState(false);
    const [isQuoteOpen, setIsQuoteOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const currentUserId = explicitUserId || currentUser?.id;

    // Derived states
    const hasLiked = useMemo(() => post.reactions?.some(r => r.userId === currentUserId && r.emoji === "❤️"), [post.reactions, currentUserId]);
    const likeCount = useMemo(() => post.reactions?.filter(r => r.emoji === "❤️").length || 0, [post.reactions]);
    const isQuotePost = !!post.repostOf && post.content !== "";
    const isPureRepost = !!post.repostOf && post.content === "";

    const displayUserInfo = isPureRepost && post.repostOf ? post.repostOf.user : post.user;
    const displayContent = isPureRepost && post.repostOf ? post.repostOf.content : post.content;
    const createdAt = isPureRepost && post.repostOf ? post.repostOf.createdAt : post.createdAt;
    const displayAttachments = isPureRepost && post.repostOf ? post.repostOf.attachments : post.attachments;

    const urls = useMemo(() => extractUrls(displayContent), [displayContent]);

    const formattedDate = useMemo(() => {
        const d = new Date(createdAt);
        return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " · " +
            d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    }, [createdAt]);

    // Simple Mutation Logic
    const likeMutation = useMutation({
        mutationFn: async () => {
            const targetId = post.repostOfId || post.id;
            return toggleLikeAction(targetId, currentUserId!, "like-" + Date.now());
        },
        onSuccess: () => {
            // Conventional way: Just invalidate all related posts
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            if (onUpdate) onUpdate(post);
        },
        onError: () => {
            toast.error("Gagal menyukai");
        }
    });

    const repostMutation = useMutation({
        mutationFn: async () => {
            const targetId = post.repostOfId || post.id;
            return repostAction(targetId, currentUserId!, "repost-" + Date.now());
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            if (res.status === "success" && !res.data) {
                toast.success("Berhasil membatalkan repost");
            } else if (res.status === "success") {
                toast.success("Berhasil membagikan");
            }
        },
        onError: () => {
            toast.error("Gagal membagikan");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            return deletePostAction(post.id, currentUserId!);
        },
        onSuccess: (res) => {
            if (res.status === "success") {
                toast.success("Postingan berhasil dihapus");
                queryClient.invalidateQueries({ queryKey: ["posts"] });
                queryClient.invalidateQueries({ queryKey: ["feed"] });
                if (isFocused) {
                    router.push("/timeline");
                }
            } else {
                toast.error(res.error?.message || "Gagal menghapus postingan");
            }
        },
        onError: () => {
            toast.error("Gagal menghapus postingan");
        }
    });

    const handleLike = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!currentUserId) return;
        likeMutation.mutate();
    };

    const handleRepost = (e?: React.MouseEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!currentUserId) return;
        repostMutation.mutate();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!currentUserId) return;
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        deleteMutation.mutate();
        setIsDeleteDialogOpen(false);
    };

    const handleCopyLink = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
        toast.success("Tautan disalin!");
    };

    const handleMediaClick = (attachments: any[], index: number) => {
        setLightboxIndex(index);
        setIsLightboxOpen(true);
    };

    const renderQuotedPost = (quotedPost: PostWithUserDTO) => (
        <div
            onClick={(e) => {
                e.stopPropagation();
                router.push(`/posts/${quotedPost.id}`);
            }}
            className="mt-3 border border-white/10 rounded-2xl p-3 flex flex-col gap-1.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors overflow-hidden cursor-pointer pointer-events-auto"
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
            {quotedPost.content && <p className="text-zinc-300 text-[14px] line-clamp-3 leading-normal">{quotedPost.content}</p>}
            <PostMedia attachments={quotedPost.attachments || []} onImageClick={(idx) => handleMediaClick(quotedPost.attachments || [], idx)} isQuoted />
        </div>
    );

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
                                <Link href={`/profile/${displayUserInfo.username}`} className="font-bold text-[16px] text-zinc-100 hover:underline leading-tight relative z-30 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                    {displayUserInfo.username}
                                </Link>
                                <span className="text-zinc-500 text-[14px]">@{displayUserInfo.username?.toLowerCase() || ""}</span>
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 rounded-full hover:bg-white/5 transition-colors relative z-30" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-zinc-100 z-[1000]">
                                {post.userId === currentUserId && (
                                    <DropdownMenuItem onClick={handleDelete} className="cursor-pointer focus:bg-red-500/10 text-red-500 focus:text-red-500">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Hapus</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {!hideReplyIndicator && post.replyToId && (
                        <div className="text-[15px] text-zinc-500 mb-3 relative z-30">
                            {post.replyTo ? (
                                <>Membalas <Link href={`/profile/${post.replyTo.user.username}`} className="text-sky-500 hover:underline" onClick={(e) => e.stopPropagation()}>@{post.replyTo.user.username}</Link></>
                            ) : <span className="italic opacity-60">Membalas postingan yang telah dihapus</span>}
                        </div>
                    )}

                    {displayContent && (
                        <div className="text-[20px] text-zinc-100 leading-normal mb-1 relative z-30 pointer-events-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    a: ({ node, ...props }) => <a {...props} className="text-sky-500 hover:underline pointer-events-auto" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} />,
                                    p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0 whitespace-pre-wrap" />,
                                    strong: ({ node, ...props }) => <strong {...props} className="font-bold text-white" />,
                                    em: ({ node, ...props }) => <em {...props} className="italic" />,
                                    code: ({ node, ...props }) => <code {...props} className="bg-white/10 px-1 py-0.5 rounded text-[0.9em] font-mono" />,
                                }}
                            >
                                {displayContent}
                            </ReactMarkdown>
                        </div>
                    )}

                    <PostMedia attachments={displayAttachments || []} onImageClick={(idx) => handleMediaClick(displayAttachments || [], idx)} />

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

                    <div className="flex items-center justify-between py-1 max-w-[400px] w-full relative z-30 pointer-events-none">
                        <InteractionButton
                            icon={MessageSquare}
                            label={post.replyCount || ""}
                            onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIsReplyOpen(true); }}
                            className="pointer-events-auto"
                            hoverColor="hover:text-sky-400"
                            hoverBg="group-hover/btn:bg-sky-500/10"
                        />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto">
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
                            <DropdownMenuContent align="start" className="bg-zinc-900 border-white/10 text-zinc-100 z-[1000]">
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

                        <InteractionButton
                            icon={Heart}
                            label={likeCount || ""}
                            onClick={handleLike}
                            className="pointer-events-auto"
                            hoverColor="hover:text-rose-500"
                            hoverBg="group-hover/btn:bg-rose-500/10"
                            active={hasLiked}
                            activeColor="text-rose-500"
                            activeBg="bg-transparent"
                            fillActive
                        />
                        <InteractionButton
                            icon={Share2}
                            onClick={handleCopyLink}
                            className="pointer-events-auto"
                            hoverColor="hover:text-sky-400"
                            hoverBg="group-hover/btn:bg-sky-500/10"
                        />
                    </div>
                </div>
                {currentUser && isReplyOpen && <ReplyDialog isOpen={isReplyOpen} onClose={() => setIsReplyOpen(false)} parentPost={(isPureRepost && post.repostOf) ? post.repostOf : post} currentUser={currentUser} onReplyCreated={(reply: any) => { if (onUpdate) onUpdate(reply); }} />}
                {currentUser && isQuoteOpen && <QuoteDialog isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} targetPost={(isPureRepost && post.repostOf) ? post.repostOf : post} currentUser={currentUser} onQuoteCreated={(quote: any) => { if (onUpdate) onUpdate(quote); }} />}
                {displayAttachments && displayAttachments.length > 0 && (
                    <ImageLightbox
                        images={displayAttachments.map(a => ({ url: a.url, filename: a.key, type: a.fileType?.startsWith('video/') ? 'video' : 'image' }))}
                        initialIndex={lightboxIndex}
                        open={isLightboxOpen}
                        onOpenChange={setIsLightboxOpen}
                    />
                )}
            </div>
        );
    }

    return (
        <div className={cn("relative border-b border-white/5 transition-colors duration-200 hover:bg-white/[0.01] overflow-hidden")}>
            <Link href={`/posts/${post.repostOfId || post.id}`} className="absolute inset-0 z-10 opacity-0" aria-label="View post" />

            {showConnector && (
                <div className={cn("absolute left-[39px] w-[2px] bg-zinc-800 z-0", isLastInChain ? "top-0 h-4" : "top-0 bottom-0")} />
            )}

            <div className="relative z-20 flex gap-3 pt-4 pb-3 px-4 pointer-events-none">
                <div className="shrink-0 z-30 relative">
                    <Link href={`/profile/${displayUserInfo.username}`} className="hover:opacity-80 block pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                        <UserAvatar src={displayUserInfo.avatar || "/avatars/avatar1.png"} className="h-10 w-10" />
                    </Link>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="block group/content outline-none">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 z-30 relative">
                                <Link href={`/profile/${displayUserInfo.username}`} className="font-bold text-[15px] text-zinc-100 hover:underline pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                    {displayUserInfo.username}
                                </Link>
                                <span className="text-zinc-500 text-sm">·</span>
                                <span className="text-zinc-500 text-sm">
                                    {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: id })}
                                </span>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 z-30 text-zinc-500 rounded-full hover:bg-white/5 transition-colors relative pointer-events-auto" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-zinc-100 z-[1000]">
                                    {post.userId === currentUserId && (
                                        <DropdownMenuItem onClick={handleDelete} className="cursor-pointer focus:bg-red-500/10 text-red-500 focus:text-red-500">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Hapus</span>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        {isPureRepost && (
                            <div className="mb-1 text-zinc-500 text-[13px] font-medium z-30 relative">
                                <Repeat2 className="h-4 w-4 inline mr-1" />
                                <Link href={`/profile/${post.user.username}`} className="hover:underline pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                    {post.user.username === currentUser?.username ? "Anda" : post.user.username} membagikan ulang
                                </Link>
                            </div>
                        )}
                        {!hideReplyIndicator && post.replyToId && !showConnector && (
                            <div className="text-[14px] text-zinc-500 mb-1 z-30 relative">
                                {post.replyTo ? (
                                    <>Membalas <Link href={`/profile/${post.replyTo.user.username}`} className="text-sky-500 hover:underline pointer-events-auto" onClick={(e) => e.stopPropagation()}>@{post.replyTo.user.username}</Link></>
                                ) : <span className="italic opacity-60">Membalas postingan yang telah dihapus</span>}
                            </div>
                        )}
                        {displayContent && (
                            <div className="text-[15px] text-zinc-100 leading-normal relative z-30 pointer-events-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        a: ({ node, ...props }) => <a {...props} className="text-sky-500 hover:underline pointer-events-auto" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} />,
                                        p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0 whitespace-pre-wrap" />,
                                        strong: ({ node, ...props }) => <strong {...props} className="font-bold text-white" />,
                                        em: ({ node, ...props }) => <em {...props} className="italic" />,
                                        code: ({ node, ...props }) => <code {...props} className="bg-white/10 px-1 py-0.5 rounded text-[0.9em] font-mono" />,
                                    }}
                                >
                                    {displayContent}
                                </ReactMarkdown>
                            </div>
                        )}

                        <div className="relative z-30 pointer-events-auto">
                            <PostMedia attachments={displayAttachments || []} onImageClick={(idx) => handleMediaClick(displayAttachments || [], idx)} />
                        </div>
                    </div>

                    {isQuotePost && post.repostOf && <div className="pointer-events-auto relative z-30">{renderQuotedPost(post.repostOf)}</div>}

                    {urls.length > 0 && <div className="mt-3 z-30 space-y-2 relative pointer-events-auto">{urls.map((url) => <div key={url} onClick={(e) => e.stopPropagation()}><LinkPreviewCard url={url} /></div>)}</div>}

                    <div className="flex items-center justify-between mt-3 max-w-[400px] w-full z-30 relative pointer-events-none">
                        <InteractionButton
                            icon={MessageSquare}
                            label={post.replyCount || ""}
                            onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIsReplyOpen(true); }}
                            className="pointer-events-auto"
                            hoverColor="hover:text-sky-400"
                            hoverBg="group-hover/btn:bg-sky-500/10"
                        />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto">
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
                            <DropdownMenuContent align="start" className="bg-zinc-900 border-white/10 text-zinc-100 z-[1000]">
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

                        <InteractionButton
                            icon={Heart}
                            label={likeCount || ""}
                            onClick={handleLike}
                            className="pointer-events-auto"
                            hoverColor="hover:text-rose-500"
                            hoverBg="group-hover/btn:bg-rose-500/10"
                            active={hasLiked}
                            activeColor="text-rose-500"
                            activeBg="bg-transparent"
                            fillActive
                        />
                        <InteractionButton
                            icon={Share2}
                            onClick={handleCopyLink}
                            className="pointer-events-auto"
                            hoverColor="hover:text-sky-400"
                            hoverBg="group-hover/btn:bg-sky-500/10"
                        />
                    </div>
                </div>
            </div>
            {currentUser && isReplyOpen && <ReplyDialog isOpen={isReplyOpen} onClose={() => setIsReplyOpen(false)} parentPost={(isPureRepost && post.repostOf) ? post.repostOf : post} currentUser={currentUser} onReplyCreated={(reply: any) => { if (onUpdate) onUpdate(reply); }} />}
            {currentUser && isQuoteOpen && <QuoteDialog isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} targetPost={(isPureRepost && post.repostOf) ? post.repostOf : post} currentUser={currentUser} onQuoteCreated={(quote: any) => { if (onUpdate) onUpdate(quote); }} />}

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-zinc-900 border-white/10 text-zinc-100 z-[1100]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Postingan?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Tindakan ini tidak dapat dibatalkan. Postingan Anda akan dihapus secara permanen dari server kami.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-white/10 text-zinc-100 hover:bg-zinc-700 hover:text-white">Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 text-white hover:bg-red-700">Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {displayAttachments && displayAttachments.length > 0 && (
                <ImageLightbox
                    images={displayAttachments.map(a => ({ url: a.url, filename: a.key, type: a.fileType?.startsWith('video/') ? 'video' : 'image' }))}
                    initialIndex={lightboxIndex}
                    open={isLightboxOpen}
                    onOpenChange={setIsLightboxOpen}
                />
            )}
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
    fillActive,
    className
}: InteractionButtonProps & { className?: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-1.5 transition-all group/btn outline-none",
                active ? (activeColor || "text-white") : cn("text-zinc-500", hoverColor),
                className
            )}
        >
            <div className={cn("p-1.5 rounded-full transition-colors flex items-center justify-center", active ? (activeBg || "bg-white/5") : hoverBg)}>
                <Icon className={cn("h-[18px] w-[18px]", active && fillActive && "fill-current")} />
            </div>
            {label !== undefined && label !== "" && <span className="text-[13px] font-medium pr-2">{label}</span>}
        </button>
    );
}
