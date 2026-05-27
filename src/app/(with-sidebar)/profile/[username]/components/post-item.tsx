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
    Link2,
    Flag,
    Bookmark,
    Globe,
    Users,
    Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
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
import { toggleLikeAction, repostAction, deletePostAction, toggleBookmarkAction } from "@/app/posts.action";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { extractUrls } from "@/lib/extract-urls";
import { toast } from "sonner";
import { ReplyDialog } from "./reply-dialog";
import { QuoteDialog } from "./quote-dialog";
import { LinkPreviewCard } from "@/app/(with-sidebar)/channels/[roomId]/components/link-preview-card";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    isFirstInChain?: boolean;
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
    isFirstInChain = false,
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

    const isQuotePost = !!post.repostOf && post.content !== "";
    const isPureRepost = !!post.repostOf && post.content === "";

    const targetPost = isPureRepost && post.repostOf ? post.repostOf : post;
    const isBookmarked = !!targetPost.isBookmarkedByCurrentUser;

    const updatePostInCache = (targetId: string, updater: (p: PostWithUserDTO) => PostWithUserDTO) => {
        queryClient.setQueriesData(
            {
                predicate: (query) => {
                    const firstKey = query.queryKey[0];
                    return firstKey === "posts" || firstKey === "feed";
                }
            },
            (oldData: any) => {
                if (!oldData) return oldData;
                const updateObject = (item: any): any => {
                    if (item && typeof item === "object") {
                        let newItem = { ...item };
                        if (newItem.id === targetId) newItem = updater(newItem);
                        if (newItem.repostOf && newItem.repostOf.id === targetId) newItem.repostOf = updater(newItem.repostOf);
                        if (newItem.replyTo && newItem.replyTo.id === targetId) newItem.replyTo = updater(newItem.replyTo);
                        if (newItem.post && typeof newItem.post === "object") newItem.post = updateObject(newItem.post);
                        if (Array.isArray(newItem.replies)) newItem.replies = newItem.replies.map(updateObject);
                        if (Array.isArray(newItem.parents)) newItem.parents = newItem.parents.map(updateObject);
                        return newItem;
                    }
                    return item;
                };
                if (Array.isArray(oldData)) return oldData.map(updateObject);
                return updateObject(oldData);
            }
        );
    };

    const hasLiked = !!targetPost.isLikedByCurrentUser;
    const likeCount = useMemo(() => {
        const baseCount = targetPost.reactions?.filter(r => r.emoji === "❤️").length || 0;
        const containsUser = targetPost.reactions?.some(r => r.userId === currentUserId && r.emoji === "❤️");
        if (targetPost.isLikedByCurrentUser && !containsUser) return baseCount + 1;
        if (!targetPost.isLikedByCurrentUser && containsUser) return Math.max(0, baseCount - 1);
        return baseCount;
    }, [targetPost.reactions, targetPost.isLikedByCurrentUser, currentUserId]);

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

    const likeMutation = useMutation({
        mutationFn: async () => toggleLikeAction(targetPost.id, currentUserId!, "like-" + Date.now()),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["posts"] });
            await queryClient.cancelQueries({ queryKey: ["feed"] });
            const nextLiked = !targetPost.isLikedByCurrentUser;
            updatePostInCache(targetPost.id, (oldPost) => {
                const containsUser = oldPost.reactions?.some((r: any) => r.userId === currentUserId && r.emoji === "❤️");
                let newReactions = oldPost.reactions || [];
                if (nextLiked && !containsUser) {
                    newReactions = [...newReactions, { id: "temp", postId: targetPost.id, userId: currentUserId!, emoji: "❤️", createdAt: new Date(), updatedAt: new Date(), user: { username: currentUser?.username || "" } }];
                } else if (!nextLiked && containsUser) {
                    newReactions = newReactions.filter((r: any) => !(r.userId === currentUserId && r.emoji === "❤️"));
                }
                return { ...oldPost, isLikedByCurrentUser: nextLiked, reactions: newReactions, reactionCount: newReactions.length };
            });
        },
        onSuccess: (res) => {
            if (res.status === "success" && res.data) updatePostInCache(targetPost.id, () => res.data!);
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            if (onUpdate) onUpdate(post);
        },
        onError: () => {
            toast.error("Gagal menyukai");
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
        }
    });

    const repostMutation = useMutation({
        mutationFn: async () => repostAction(targetPost.id, currentUserId!, "repost-" + Date.now()),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["posts"] });
            await queryClient.cancelQueries({ queryKey: ["feed"] });
            const nextReposted = !targetPost.isRepostedByCurrentUser;
            updatePostInCache(targetPost.id, (oldPost) => {
                const currentCount = oldPost.repostCount || 0;
                return { ...oldPost, isRepostedByCurrentUser: nextReposted, repostCount: nextReposted ? currentCount + 1 : Math.max(0, currentCount - 1) };
            });
        },
        onSuccess: (res) => {
            if (res.status === "success" && res.data) updatePostInCache(targetPost.id, () => res.data!);
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            if (res.status === "success") toast.success(res.data ? "Berhasil membagikan" : "Berhasil membatalkan repost");
        },
        onError: () => {
            toast.error("Gagal membagikan");
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async () => deletePostAction(post.id, currentUserId!),
        onSuccess: (res) => {
            if (res.status === "success") {
                toast.success("Postingan berhasil dihapus");
                queryClient.invalidateQueries({ queryKey: ["posts"] });
                queryClient.invalidateQueries({ queryKey: ["feed"] });
                if (isFocused) router.push("/timeline");
            } else toast.error(res.error?.message || "Gagal menghapus postingan");
        }
    });

    const bookmarkMutation = useMutation({
        mutationFn: async () => toggleBookmarkAction(targetPost.id, currentUserId!),
        onMutate: async () => {
            const nextBookmarked = !isBookmarked;
            updatePostInCache(targetPost.id, (oldPost) => ({ ...oldPost, isBookmarkedByCurrentUser: nextBookmarked }));
        },
        onSuccess: (res) => {
            if (res.status === "success") {
                updatePostInCache(targetPost.id, () => res.data!);
                toast.success(res.data?.isBookmarkedByCurrentUser ? "Disimpan ke bookmark" : "Dihapus dari bookmark");
            }
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
        }
    });

    const handleMediaClick = (attachments: any[], index: number) => {
        setLightboxIndex(index);
        setIsLightboxOpen(true);
    };

    const renderQuotedPost = (quotedPost: PostWithUserDTO) => (
        <div
            onClick={(e) => { e.stopPropagation(); router.push(`/posts/${quotedPost.id}`); }}
            className="mt-3 border border-border rounded-2xl p-3 flex flex-col gap-1.5 bg-accent/10 hover:bg-accent/20 transition-colors overflow-hidden cursor-pointer pointer-events-auto"
        >
            <div className="flex items-center gap-1.5">
                <div onClick={(e) => { e.stopPropagation(); router.push(`/profile/${quotedPost.user.username}`); }}>
                    <UserAvatar src={quotedPost.user.avatar || "/avatars/avatar1.png"} className="h-4 w-4 shrink-0 hover:opacity-80" />
                </div>
                <span onClick={(e) => { e.stopPropagation(); router.push(`/profile/${quotedPost.user.username}`); }} className="font-bold text-foreground text-[14px] truncate hover:underline">
                    {quotedPost.user.username}
                </span>
                <span className="text-muted-foreground text-[13px]">·</span>
                <span className="text-muted-foreground text-[13px] whitespace-nowrap">
                    {formatDistanceToNow(new Date(quotedPost.createdAt), { addSuffix: true, locale: id })}
                </span>
            </div>
            {quotedPost.content && <p className="text-foreground/80 text-[14px] line-clamp-3 leading-normal">{quotedPost.content}</p>}
            <PostMedia attachments={quotedPost.attachments || []} onImageClick={(idx) => handleMediaClick(quotedPost.attachments || [], idx)} isQuoted />
        </div>
    );

    const VisibilityIcon = ({ visibility, className }: { visibility?: string, className?: string }) => {
        if (visibility === "unlisted") return <Users className={cn("h-3 w-3", className)} />;
        if (visibility === "private") return <Lock className={cn("h-3 w-3", className)} />;
        return <Globe className={cn("h-3 w-3", className)} />;
    };

    // Shared Gutter Alignment Logic
    const gutterWidth = "w-12"; // 48px
    const lineX = "left-[40px]"; // 16px container padding + 24px (gutter/2)

    if (isFocused) {
        const hasParent = !isFirstInChain;
        const hasChild = showConnector;

        return (
            <div className="relative border-b border-border bg-background transition-colors duration-200">
                <Link href={`/posts/${isPureRepost ? (post.repostOfId || post.id) : post.id}`} className="absolute inset-0 z-10 opacity-0 pointer-events-none" aria-label="View post" />

                {/* Connector Lines (Behind background) */}
                {hasParent && (
                    <div className={cn("absolute w-[2px] bg-border z-0", lineX, "top-0 h-[40px]")} />
                )}
                {hasChild && (
                    <div className={cn("absolute w-[2px] bg-border z-0", lineX, "top-[64px] bottom-0")} />
                )}

                <div className="relative z-10 bg-background flex flex-col pt-4 pb-1 px-4 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={cn("shrink-0 z-30 relative flex flex-col items-center", gutterWidth)}>
                                <Link href={`/profile/${displayUserInfo.username}`} className="hover:opacity-80 block relative z-30" onClick={(e) => e.stopPropagation()}>
                                    <UserAvatar src={displayUserInfo.avatar || "/avatars/avatar1.png"} className="h-12 w-12" />
                                </Link>
                            </div>
                            <div className="flex flex-col">
                                <Link href={`/profile/${displayUserInfo.username}`} className="font-bold text-[16px] text-foreground hover:underline leading-tight relative z-30 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                    {displayUserInfo.username}
                                </Link>
                                <span className="text-muted-foreground text-[14px]">@{displayUserInfo.username?.toLowerCase() || ""}</span>
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-full hover:bg-accent transition-colors relative z-30" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground z-[1000] w-48">
                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`); toast.success("Tautan disalin!"); }} className="cursor-pointer focus:bg-accent flex items-center">
                                    <Link2 className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>Salin Tautan</span>
                                </DropdownMenuItem>
                                {post.userId !== currentUserId && (
                                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast.success("Laporan terkirim."); }} className="cursor-pointer focus:bg-accent flex items-center text-amber-500 focus:text-amber-500">
                                        <Flag className="mr-2 h-4 w-4" />
                                        <span>Laporkan</span>
                                    </DropdownMenuItem>
                                )}
                                {post.userId === currentUserId && (
                                    <>
                                        <DropdownMenuSeparator className="bg-border" />
                                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsDeleteDialogOpen(true); }} className="cursor-pointer focus:bg-destructive/10 text-destructive focus:text-destructive flex items-center">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Hapus</span>
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex flex-col transition-all pl-0">
                        {!hideReplyIndicator && post.replyToId && (
                            <div className="text-[15px] text-muted-foreground mb-3 relative z-30">
                                {post.replyTo ? (
                                    <>Membalas <Link href={`/profile/${post.replyTo.user.username}`} className="text-sky-500 hover:underline" onClick={(e) => e.stopPropagation()}>@{post.replyTo.user.username}</Link></>
                                ) : <span className="italic opacity-60">Membalas postingan yang telah dihapus</span>}
                            </div>
                        )}

                        {displayContent && (
                            <div className="text-[20px] text-foreground leading-normal mb-1 relative z-30 pointer-events-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        a: ({ node, ...props }) => <a {...props} className="text-sky-500 hover:underline pointer-events-auto" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} />,
                                        p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0 whitespace-pre-wrap" />,
                                        strong: ({ node, ...props }) => <strong {...props} className="font-bold text-foreground" />,
                                        em: ({ node, ...props }) => <em {...props} className="italic" />,
                                        code: ({ node, ...props }) => <code className="bg-accent px-1 py-0.5 rounded text-[0.9em] font-mono" />,
                                    }}
                                >
                                    {displayContent}
                                </ReactMarkdown>
                            </div>
                        )}

                        <PostMedia attachments={displayAttachments || []} onImageClick={(idx) => handleMediaClick(displayAttachments || [], idx)} />
                        {isQuotePost && post.repostOf && renderQuotedPost(post.repostOf)}

                        {urls.length > 0 && (
                            <div className="my-4 space-y-2">
                                {urls.map((url) => (
                                    <div key={url} onClick={(e) => e.stopPropagation()} className="relative z-30">
                                        <LinkPreviewCard url={url} preview={post.linkPreviews?.find(lp => lp.url === url)} />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="py-4 border-y border-border flex flex-col gap-4">
                            <div className="text-muted-foreground text-[15px] flex items-center gap-2">
                                {formattedDate}
                                <span>·</span>
                                <div className="flex items-center gap-1" title={post.visibility}>
                                    <VisibilityIcon visibility={post.visibility} className="h-3.5 w-3.5" />
                                    <span className="text-[13px] capitalize">{post.visibility}</span>
                                </div>
                            </div>
                            {(likeCount > 0 || (targetPost.repostCount ?? 0) > 0) && (
                                <div className="flex gap-4 text-[15px] border-t border-border pt-4">
                                    {(targetPost.repostCount ?? 0) > 0 && (
                                        <div className="flex gap-1 items-center">
                                            <span className="font-bold text-foreground">{targetPost.repostCount}</span>
                                            <span className="text-muted-foreground">Reposts</span>
                                        </div>
                                    )}
                                    {likeCount > 0 && (
                                        <div className="flex gap-1 items-center">
                                            <span className="font-bold text-foreground">{likeCount}</span>
                                            <span className="text-muted-foreground">Likes</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between py-1 max-w-[440px] w-full relative z-30 pointer-events-none">
                            <InteractionButton
                                icon={MessageSquare}
                                label={targetPost.replyCount || ""}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsReplyOpen(true); }}
                                className="pointer-events-auto"
                                hoverColor="hover:text-sky-500"
                                hoverBg="group-hover/btn:bg-sky-500/10"
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto">
                                        <InteractionButton
                                            icon={Repeat2}
                                            label={targetPost.repostCount || ""}
                                            onClick={(e) => e.preventDefault()}
                                            hoverColor="hover:text-emerald-500"
                                            hoverBg="group-hover/btn:bg-emerald-500/10"
                                            active={targetPost.isRepostedByCurrentUser}
                                            activeColor="text-emerald-500"
                                        />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="bg-popover border-border text-popover-foreground z-[1000]">
                                    <DropdownMenuItem onClick={() => repostMutation.mutate()} className="cursor-pointer focus:bg-accent focus:text-emerald-500">
                                        <Repeat2 className="mr-2 h-4 w-4" />
                                        <span>{targetPost.isRepostedByCurrentUser ? "Batalkan Repost" : "Repost"}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsQuoteOpen(true); }} className="cursor-pointer focus:bg-accent focus:text-emerald-500">
                                        <PenLine className="mr-2 h-4 w-4" />
                                        <span>Quote</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <InteractionButton
                                icon={Heart}
                                label={likeCount || ""}
                                onClick={() => likeMutation.mutate()}
                                className="pointer-events-auto"
                                hoverColor="hover:text-rose-500"
                                hoverBg="group-hover/btn:bg-rose-500/10"
                                active={hasLiked}
                                activeColor="text-rose-500"
                                fillActive
                            />
                            <InteractionButton
                                icon={Bookmark}
                                onClick={() => bookmarkMutation.mutate()}
                                className="pointer-events-auto"
                                hoverColor="hover:text-amber-500"
                                hoverBg="group-hover/btn:bg-amber-500/10"
                                active={isBookmarked}
                                activeColor="text-amber-500"
                                fillActive
                            />
                            <InteractionButton
                                icon={Share2}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`); toast.success("Tautan disalin!"); }}
                                className="pointer-events-auto"
                                hoverColor="hover:text-sky-500"
                                hoverBg="group-hover/btn:bg-sky-500/10"
                            />
                        </div>
                    </div>
                </div>
                {currentUser && isReplyOpen && <ReplyDialog isOpen={isReplyOpen} onClose={() => setIsReplyOpen(false)} parentPost={targetPost} currentUser={currentUser} onReplyCreated={(reply) => { if (onUpdate) onUpdate(reply); }} />}
                {currentUser && isQuoteOpen && <QuoteDialog isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} targetPost={targetPost} currentUser={currentUser} onQuoteCreated={(quote) => { if (onUpdate) onUpdate(quote); }} />}
                {displayAttachments && displayAttachments.length > 0 && (
                    <ImageLightbox
                        images={displayAttachments.map(a => ({ url: a.url, filename: a.key, type: a.fileType?.startsWith('video/') ? 'video' : 'image' }))}
                        initialIndex={lightboxIndex}
                        open={isLightboxOpen}
                        onOpenChange={setIsLightboxOpen}
                    />
                )}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent className="bg-popover border-border text-popover-foreground z-[1100]">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Postingan?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-accent border-border text-foreground hover:bg-accent/80 hover:text-foreground">Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    return (
        <div className={cn("relative border-b border-border transition-colors duration-200 hover:bg-accent/5 overflow-hidden")}>
            <Link href={`/posts/${isPureRepost ? (post.repostOfId || post.id) : post.id}`} className="absolute inset-0 z-10 opacity-0" aria-label="View post" />

            {/* Connector Line Column */}
            {showConnector && (
                <div className={cn(
                    "absolute w-[2px] bg-border z-0",
                    lineX,
                    isFirstInChain ? "top-[56px] bottom-0" : 
                    isLastInChain ? "top-0 h-[36px]" : 
                    "top-0 bottom-0"
                )} />
            )}

            <div className="relative z-20 flex gap-0 pt-4 pb-3 px-4 pointer-events-none">
                <div className={cn("shrink-0 z-30 relative flex flex-col items-center", gutterWidth)}>
                    <Link href={`/profile/${displayUserInfo.username}`} className="hover:opacity-80 block pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                        <UserAvatar src={displayUserInfo.avatar || "/avatars/avatar1.png"} className="h-10 w-10" />
                    </Link>
                </div>

                <div className="flex-1 min-w-0 pl-3">
                    <div className="block group/content outline-none">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 z-30 relative">
                                <Link href={`/profile/${displayUserInfo.username}`} className="font-bold text-[15px] text-foreground hover:underline pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                    {displayUserInfo.username}
                                </Link>
                                <span className="text-muted-foreground text-sm">·</span>
                                <span className="text-muted-foreground text-sm">
                                    {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: id })}
                                </span>
                                <span className="text-muted-foreground text-sm">·</span>
                                <div className="text-muted-foreground" title={post.visibility}>
                                    <VisibilityIcon visibility={post.visibility} className="opacity-70" />
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 z-30 text-muted-foreground rounded-full hover:bg-accent transition-colors relative pointer-events-auto" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground z-[1000] w-48">
                                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`); toast.success("Tautan disalin!"); }} className="cursor-pointer focus:bg-accent flex items-center">
                                        <Link2 className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>Salin Tautan</span>
                                    </DropdownMenuItem>
                                    {post.userId !== currentUserId && (
                                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast.success("Laporan terkirim."); }} className="cursor-pointer focus:bg-accent flex items-center text-amber-500 focus:text-amber-500">
                                            <Flag className="mr-2 h-4 w-4" />
                                            <span>Laporkan</span>
                                        </DropdownMenuItem>
                                    )}
                                    {post.userId === currentUserId && (
                                        <>
                                            <DropdownMenuSeparator className="bg-border" />
                                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsDeleteDialogOpen(true); }} className="cursor-pointer focus:bg-destructive/10 text-destructive focus:text-destructive flex items-center">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Hapus</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        {isPureRepost && (
                            <div className="mb-1 text-muted-foreground text-[13px] font-medium z-30 relative">
                                <Repeat2 className="h-4 w-4 inline mr-1" />
                                <Link href={`/profile/${post.user.username}`} className="hover:underline pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                    {post.user.username === currentUser?.username ? "Anda" : post.user.username} membagikan ulang
                                </Link>
                            </div>
                        )}
                        {!hideReplyIndicator && post.replyToId && !showConnector && (
                            <div className="text-[14px] text-muted-foreground mb-1 z-30 relative">
                                {post.replyTo ? (
                                    <>Membalas <Link href={`/profile/${post.replyTo.user.username}`} className="text-sky-500 hover:underline pointer-events-auto" onClick={(e) => e.stopPropagation()}>@{post.replyTo.user.username}</Link></>
                                ) : <span className="italic opacity-60">Membalas postingan yang telah dihapus</span>}
                            </div>
                        )}
                        {displayContent && (
                            <div className="text-[15px] text-foreground leading-normal relative z-30 pointer-events-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        a: ({ node, ...props }) => <a {...props} className="text-sky-500 hover:underline pointer-events-auto" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} />,
                                        p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0 whitespace-pre-wrap" />,
                                        strong: ({ node, ...props }) => <strong {...props} className="font-bold text-foreground" />,
                                        em: ({ node, ...props }) => <em {...props} className="italic" />,
                                        code: ({ node, ...props }) => <code className="bg-accent px-1 py-0.5 rounded text-[0.9em] font-mono" />,
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
                    {urls.length > 0 && (
                        <div className="mt-3 z-30 space-y-2 relative pointer-events-auto">
                            {urls.map((url) => (
                                <div key={url} onClick={(e) => e.stopPropagation()}>
                                    <LinkPreviewCard url={url} preview={post.linkPreviews?.find(lp => lp.url === url)} />
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center justify-between mt-3 max-w-[440px] w-full z-30 relative pointer-events-none">
                        <InteractionButton
                            icon={MessageSquare}
                            label={targetPost.replyCount || ""}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsReplyOpen(true); }}
                            className="pointer-events-auto"
                            hoverColor="hover:text-sky-500"
                            hoverBg="group-hover/btn:bg-sky-500/10"
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto">
                                    <InteractionButton
                                        icon={Repeat2}
                                        label={targetPost.repostCount || ""}
                                        onClick={(e) => e.preventDefault()}
                                        hoverColor="hover:text-emerald-500"
                                        hoverBg="group-hover/btn:bg-emerald-500/10"
                                        active={targetPost.isRepostedByCurrentUser}
                                        activeColor="text-emerald-500"
                                    />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-popover border-border text-popover-foreground z-[1000]">
                                <DropdownMenuItem onClick={() => repostMutation.mutate()} className="cursor-pointer focus:bg-accent focus:text-emerald-500">
                                    <Repeat2 className="mr-2 h-4 w-4" />
                                    <span>{targetPost.isRepostedByCurrentUser ? "Batalkan Repost" : "Repost"}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsQuoteOpen(true); }} className="cursor-pointer focus:bg-accent focus:text-emerald-500">
                                    <PenLine className="mr-2 h-4 w-4" />
                                    <span>Quote</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <InteractionButton
                            icon={Heart}
                            label={likeCount || ""}
                            onClick={() => likeMutation.mutate()}
                            className="pointer-events-auto"
                            hoverColor="hover:text-rose-500"
                            hoverBg="group-hover/btn:bg-rose-500/10"
                            active={hasLiked}
                            activeColor="text-rose-500"
                            fillActive
                        />
                        <InteractionButton
                            icon={Bookmark}
                            onClick={() => bookmarkMutation.mutate()}
                            className="pointer-events-auto"
                            hoverColor="hover:text-amber-500"
                            hoverBg="group-hover/btn:bg-amber-500/10"
                            active={isBookmarked}
                            activeColor="text-amber-500"
                            fillActive
                        />
                        <InteractionButton
                            icon={Share2}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`); toast.success("Tautan disalin!"); }}
                            className="pointer-events-auto"
                            hoverColor="hover:text-sky-500"
                            hoverBg="group-hover/btn:bg-sky-500/10"
                        />
                    </div>
                </div>
            </div>
            {currentUser && isReplyOpen && <ReplyDialog isOpen={isReplyOpen} onClose={() => setIsReplyOpen(false)} parentPost={targetPost} currentUser={currentUser} onReplyCreated={(reply) => { if (onUpdate) onUpdate(reply); }} />}
            {currentUser && isQuoteOpen && <QuoteDialog isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} targetPost={targetPost} currentUser={currentUser} onQuoteCreated={(quote) => { if (onUpdate) onUpdate(quote); }} />}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-popover border-border text-popover-foreground z-[1100]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Postingan?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-accent border-border text-foreground hover:bg-accent/80 hover:text-foreground">Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
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
    hoverColor = "hover:text-foreground",
    hoverBg = "group-hover/btn:bg-accent",
    active,
    activeColor,
    activeBg,
    fillActive,
    className
}: InteractionButtonProps & { className?: string }) {
    return (
        <button onClick={onClick} className={cn("flex items-center gap-1.5 transition-all group/btn outline-none", active ? (activeColor || "text-foreground") : cn("text-muted-foreground", hoverColor), className)}>
            <div className={cn("p-1.5 rounded-full transition-colors flex items-center justify-center", active ? (activeBg || "bg-accent") : hoverBg)}>
                <Icon className={cn("h-[18px] w-[18px]", active && fillActive && "fill-current")} />
            </div>
            {label !== undefined && label !== "" && <span className="text-[13px] font-medium pr-2">{label}</span>}
        </button>
    );
}
