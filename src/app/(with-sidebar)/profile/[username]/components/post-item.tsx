"use client";

import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PostMedia } from "./post-media";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { 
    MessageSquare, 
    Repeat2, 
    Heart, 
    Share2, 
    MoreHorizontal, 
    Trash2, 
    Flag, 
    PenLine, 
    Bookmark, 
    Globe, 
    Lock, 
    Users
} from "lucide-react";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useMemo } from "react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleLikeAction, repostAction, deletePostAction, toggleBookmarkAction } from "@/app/posts.action";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ReplyDialog } from "./reply-dialog";
import { QuoteDialog } from "./quote-dialog";
import { extractUrls } from "@/lib/extract-urls";
import { LinkPreviewCard } from "@/app/(with-sidebar)/channels/[roomId]/components/link-preview-card";

interface PostItemProps {
    post: PostWithUserDTO;
    currentUserId?: string;
    currentUser?: { id: string; username: string; avatar: string };
    onUpdate?: (updatedPost: PostWithUserDTO) => void;
    isFocused?: boolean;
    showConnector?: boolean;
    isFirstInChain?: boolean;
    isLastInChain?: boolean;
    hideReplyIndicator?: boolean;
}

export function PostItem({ 
    post, 
    currentUserId, 
    currentUser, 
    onUpdate, 
    isFocused = false,
    showConnector = false,
    isFirstInChain = false,
    isLastInChain = false,
    hideReplyIndicator = false
}: PostItemProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isReplyOpen, setIsReplyOpen] = useState(false);
    const [isQuoteOpen, setIsQuoteOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const isPureRepost = !post.content && !!post.repostOf && !post.attachments?.length;
    const isQuotePost = (!!post.content || !!post.attachments?.length) && !!post.repostOf;
    const targetPost = isPureRepost && post.repostOf ? post.repostOf : post;

    const likeMutation = useMutation({
        mutationFn: () => toggleLikeAction(targetPost.id, currentUserId!),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["posts"] });
            const previousPosts = queryClient.getQueryData(["posts"]);
            updatePostInCache(targetPost.id, (old) => ({
                ...old,
                isLikedByCurrentUser: !old.isLikedByCurrentUser,
                reactions: !old.isLikedByCurrentUser 
                    ? [...(old.reactions || []), { id: "temp", postId: old.id, userId: currentUserId!, emoji: "❤️", createdAt: new Date(), updatedAt: new Date(), user: { username: currentUser?.username || "me" } }]
                    : (old.reactions || []).filter(r => r.userId !== currentUserId || r.emoji !== "❤️")
            }));
            return { previousPosts };
        },
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(["posts"], context?.previousPosts);
            toast.error("Gagal menyukai postingan");
        },
        onSuccess: (res) => {
            if (res.status === "success" && res.data) {
                updatePostInCache(targetPost.id, () => res.data!);
            }
        }
    });

    const repostMutation = useMutation({
        mutationFn: () => repostAction(targetPost.id, currentUserId!),
        onSuccess: (res) => {
            if (res.status === "success") {
                if (res.data) {
                    updatePostInCache(targetPost.id, () => res.data!);
                    toast.success("Berhasil membagikan ulang");
                } else {
                    toast.success("Batal membagikan ulang");
                }
                queryClient.invalidateQueries({ queryKey: ["posts"] });
                queryClient.invalidateQueries({ queryKey: ["feed"] });
            }
        },
        onError: () => {
            toast.error("Gagal membagikan ulang");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => deletePostAction(post.id, currentUserId!),
        onSuccess: (res) => {
            if (res.status === "success") {
                toast.success("Postingan dihapus");
                setIsDeleteDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ["posts"] });
                queryClient.invalidateQueries({ queryKey: ["feed"] });
            }
        },
        onError: () => {
            toast.error("Gagal menghapus postingan");
        }
    });

    const bookmarkMutation = useMutation({
        mutationFn: () => toggleBookmarkAction(targetPost.id, currentUserId!),
        onMutate: async () => {
            updatePostInCache(targetPost.id, (old) => ({
                ...old,
                isBookmarkedByCurrentUser: !old.isBookmarkedByCurrentUser
            }));
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

    const getUserInfo = (p: PostWithUserDTO) => {
        const u = p.user || p.remoteActor;
        const isRemote = !!p.remoteActor;
        const username = u?.username || "unknown";
        const domain = p.remoteActor?.domain;
        const handle = isRemote ? `@${username}@${domain}` : `@${username}`;
        const profilePath = isRemote ? `/profile/@${username}@${domain}` : `/profile/${username}`;
        return { username, avatar: u?.avatar || "/avatars/avatar1.png", displayName: (u as any)?.name || username, handle, profilePath, isRemote, domain };
    };

    const displayUserInfo = getUserInfo(isPureRepost && post.repostOf ? post.repostOf : post);
    const reposterUserInfo = isPureRepost ? getUserInfo(post) : null;
    const displayContent = isPureRepost && post.repostOf ? post.repostOf.content : post.content;
    const createdAt = isPureRepost && post.repostOf ? post.repostOf.createdAt : post.createdAt;
    const displayAttachments = isPureRepost && post.repostOf ? post.repostOf.attachments : post.attachments;

    const urls = useMemo(() => extractUrls(displayContent), [displayContent]);

    const updatePostInCache = (postId: string, updateFn: (post: PostWithUserDTO) => PostWithUserDTO) => {
        queryClient.setQueriesData(
            { queryKey: ["posts"] },
            (oldData: any) => {
                if (!oldData) return oldData;
                const updateObject = (item: any) => {
                    if (item.id === postId) return updateFn(item);
                    if (item.repostOf?.id === postId) return { ...item, repostOf: updateFn(item.repostOf) };
                    if (item.replyTo?.id === postId) return { ...item, replyTo: updateFn(item.replyTo) };
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

    const isBookmarked = !!targetPost.isBookmarkedByCurrentUser;

    const renderQuotedPost = (quotedPost: PostWithUserDTO) => {
        const quotedUserInfo = getUserInfo(quotedPost);
        return (
            <div
                onClick={(e) => { e.stopPropagation(); router.push(`/posts/${quotedPost.id}`); }}
                className="mt-3 border border-border rounded-2xl p-3 flex flex-col gap-2 bg-accent/10 hover:bg-accent/20 transition-colors overflow-hidden cursor-pointer pointer-events-auto"
            >
                <div className="flex items-start gap-2">
                    <Link href={quotedUserInfo.profilePath} onClick={(e) => e.stopPropagation()} className="shrink-0 mt-0.5">
                        <UserAvatar src={quotedUserInfo.avatar} className="h-5 w-5 shrink-0 hover:opacity-80" />
                    </Link>
                    <div className="flex flex-col min-w-0 leading-tight">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Link href={quotedUserInfo.profilePath} className="font-bold text-foreground text-[14px] line-clamp-1 hover:underline" onClick={(e) => e.stopPropagation()}>
                                {quotedUserInfo.displayName || quotedUserInfo.username}
                            </Link>
                            <span className="text-muted-foreground text-[13px] shrink-0">·</span>
                            <span className="text-muted-foreground text-[13px] whitespace-nowrap shrink-0">
                                {formatDistanceToNow(new Date(quotedPost.createdAt), { addSuffix: true, locale: id })}
                            </span>
                        </div>
                        <Link href={quotedUserInfo.profilePath} className="text-muted-foreground text-[12px] line-clamp-1" onClick={(e) => e.stopPropagation()}>
                            {quotedUserInfo.handle}
                        </Link>
                    </div>
                </div>
                {quotedPost.content && <p className="text-foreground/80 text-[14px] line-clamp-3 leading-normal">{quotedPost.content}</p>}
                <PostMedia attachments={quotedPost.attachments || []} onImageClick={(idx) => handleMediaClick(quotedPost.attachments || [], idx)} isQuoted />
            </div>
        );
    };

    const VisibilityIcon = ({ visibility, className }: { visibility?: string, className?: string }) => {
        if (visibility === "unlisted") return <Users className={cn("h-3 w-3", className)} />;
        if (visibility === "private") return <Lock className={cn("h-3 w-3", className)} />;
        return <Globe className={cn("h-3 w-3", className)} />;
    };

    const gutterWidth = "w-10 md:w-12"; 
    const lineX = "left-[31px] md:left-[39px]"; 

    const formattedDate = new Date(createdAt).toLocaleString('id-ID', { hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'short', year: 'numeric' });

    if (isFocused) {
        return (
            <div className="flex flex-col px-4 py-4 border-b border-border bg-background select-none">
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Link href={displayUserInfo.profilePath} className="hover:opacity-80 shrink-0 relative z-30" onClick={(e) => e.stopPropagation()}>
                                <UserAvatar src={displayUserInfo.avatar || "/avatars/avatar1.png"} className="h-12 w-12" />
                            </Link>
                            <div className="flex flex-col min-w-0">
                                <Link href={displayUserInfo.profilePath} className="group/link flex flex-col leading-tight relative z-30 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                    <span className="font-bold text-[17px] text-foreground group-hover/link:underline line-clamp-1">{displayUserInfo.displayName || displayUserInfo.username}</span>
                                    <span className="text-muted-foreground text-[14px] line-clamp-1">{displayUserInfo.handle}</span>
                                </Link>
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground rounded-full hover:bg-accent transition-colors relative z-30" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground z-[1000] w-48 shadow-xl">
                                <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`); toast.success("Tautan disalin!"); }} className="cursor-pointer focus:bg-accent flex items-center py-2.5">
                                    <Share2 className="mr-2 h-4 w-4" />
                                    <span>Salin Tautan</span>
                                </DropdownMenuItem>
                                {post.userId !== currentUserId && (
                                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast.success("Laporan terkirim."); }} className="cursor-pointer focus:bg-accent flex items-center py-2.5 text-amber-500 focus:text-amber-500">
                                        <Flag className="mr-2 h-4 w-4" />
                                        <span>Laporkan</span>
                                    </DropdownMenuItem>
                                )}
                                {post.userId === currentUserId && (
                                    <>
                                        <DropdownMenuSeparator className="bg-border" />
                                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsDeleteDialogOpen(true); }} className="cursor-pointer focus:bg-destructive/10 text-destructive focus:text-destructive flex items-center py-2.5">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Hapus</span>
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex flex-col">
                        {!hideReplyIndicator && post.replyToId && (
                            <div className="text-[15px] text-muted-foreground mb-3 relative z-30">
                                {post.replyTo ? (() => {
                                    const replyUserInfo = getUserInfo(post.replyTo);
                                    return <>Membalas <Link href={replyUserInfo.profilePath} className="text-sky-500 hover:underline" onClick={(e) => e.stopPropagation()}>{replyUserInfo.handle}</Link></>;
                                })() : <span className="italic opacity-60">Membalas postingan yang telah dihapus</span>}
                            </div>
                        )}
                        {displayContent && (
                            <div className="text-[19px] md:text-[21px] text-foreground leading-normal mb-1 relative z-30 pointer-events-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                    a: ({ node, ...props }) => <a {...props} className="text-sky-500 hover:underline pointer-events-auto" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} />,
                                    p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0 whitespace-pre-wrap" />,
                                    strong: ({ node, ...props }) => <strong {...props} className="font-bold text-foreground" />,
                                    em: ({ node, ...props }) => <em {...props} className="italic" />,
                                    code: ({ node, ...props }) => <code className="bg-accent px-1 py-0.5 rounded text-[0.9em] font-mono" />,
                                }}>
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
                        <div className="py-4 border-y border-border flex flex-col gap-4 mt-2">
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
                                        <span className="text-muted-foreground">
                                            <span className="font-bold text-foreground">{(targetPost.repostCount ?? 0)}</span> Repost
                                        </span>
                                    )}
                                    {likeCount > 0 && (
                                        <span className="text-muted-foreground">
                                            <span className="font-bold text-foreground">{likeCount}</span> Suka
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-around py-2 border-b border-border mb-2">
                            <InteractionButton icon={MessageSquare} onClick={() => setIsReplyOpen(true)} hoverColor="hover:text-sky-500" hoverBg="group-hover/btn:bg-sky-500/10" />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="pointer-events-auto">
                                        <InteractionButton icon={Repeat2} onClick={(e) => e.preventDefault()} hoverColor="hover:text-emerald-500" hoverBg="group-hover/btn:bg-emerald-500/10" active={targetPost.isRepostedByCurrentUser} activeColor="text-emerald-500" />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="bg-popover border-border text-popover-foreground z-[1000] shadow-xl">
                                    <DropdownMenuItem onClick={() => repostMutation.mutate()} className="cursor-pointer focus:bg-accent focus:text-emerald-500 py-2.5">
                                        <Repeat2 className="mr-2 h-4 w-4" />
                                        <span>{targetPost.isRepostedByCurrentUser ? "Batalkan Repost" : "Repost"}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsQuoteOpen(true); }} className="cursor-pointer focus:bg-accent focus:text-emerald-500 py-2.5">
                                        <PenLine className="mr-2 h-4 w-4" />
                                        <span>Quote</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <InteractionButton icon={Heart} onClick={() => likeMutation.mutate()} hoverColor="hover:text-rose-500" hoverBg="group-hover/btn:bg-rose-500/10" active={hasLiked} activeColor="text-rose-500" fillActive />
                            <InteractionButton icon={Bookmark} onClick={() => bookmarkMutation.mutate()} hoverColor="hover:text-amber-500" hoverBg="group-hover/btn:bg-amber-500/10" active={isBookmarked} activeColor="text-amber-500" fillActive />
                            <InteractionButton icon={Share2} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`); toast.success("Tautan disalin!"); }} hoverColor="hover:text-sky-500" hoverBg="group-hover/btn:bg-sky-500/10" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div onClick={() => router.push(`/posts/${post.id}`)} className="flex flex-col border-b border-border/50 hover:bg-white/[0.02] transition-colors relative cursor-pointer select-none">
            {showConnector && (
                <div className={cn("absolute w-[2px] bg-border z-0", lineX, isFirstInChain ? "top-[56px] bottom-0" : isLastInChain ? "top-0 h-[36px]" : "top-0 bottom-0")} />
            )}
            <div className="relative z-20 flex gap-0 pt-4 pb-3 px-4 pointer-events-none">
                <div className={cn("shrink-0 z-30 relative flex flex-col items-center", gutterWidth)}>
                    <Link href={displayUserInfo.profilePath} className="hover:opacity-80 block pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                        <UserAvatar src={displayUserInfo.avatar || "/avatars/avatar1.png"} className="h-10 w-10" />
                    </Link>
                </div>
                <div className="flex-1 min-w-0 pl-3 md:pl-4">
                    <div className="block group/content outline-none">
                        <div className="flex items-start justify-between mb-0.5">
                            <div className="flex flex-col min-w-0 z-30 relative flex-1">
                                <div className="flex items-center gap-1.5 min-w-0 leading-tight mb-0.5">
                                    <Link href={displayUserInfo.profilePath} className="font-bold text-[15px] text-foreground hover:underline pointer-events-auto line-clamp-1" onClick={(e) => e.stopPropagation()}>
                                        {displayUserInfo.displayName || displayUserInfo.username}
                                    </Link>
                                    <span className="text-muted-foreground text-[13px] shrink-0">·</span>
                                    <span className="text-muted-foreground text-[13px] whitespace-nowrap shrink-0">
                                        {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: id })}
                                    </span>
                                </div>
                                <Link href={displayUserInfo.profilePath} className="text-muted-foreground text-[13px] line-clamp-1 pointer-events-auto leading-none mb-1.5" onClick={(e) => e.stopPropagation()}>
                                    {displayUserInfo.handle}
                                </Link>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 z-30 text-muted-foreground rounded-full hover:bg-accent transition-colors relative pointer-events-auto" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground z-[1000] w-48 shadow-xl">
                                    <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`); toast.success("Tautan disalin!"); }} className="cursor-pointer focus:bg-accent flex items-center py-2">
                                        <Share2 className="mr-2 h-4 w-4" />
                                        <span>Salin Tautan</span>
                                    </DropdownMenuItem>
                                    {post.userId !== currentUserId && (
                                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast.success("Laporan terkirim."); }} className="cursor-pointer focus:bg-accent flex items-center py-2 text-amber-500 focus:text-amber-500">
                                            <Flag className="mr-2 h-4 w-4" />
                                            <span>Laporkan</span>
                                        </DropdownMenuItem>
                                    )}
                                    {post.userId === currentUserId && (
                                        <>
                                            <DropdownMenuSeparator className="bg-border" />
                                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsDeleteDialogOpen(true); }} className="cursor-pointer focus:bg-destructive/10 text-destructive focus:text-destructive flex items-center py-2">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Hapus</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        {isPureRepost && reposterUserInfo && (
                            <div className="mb-2 text-muted-foreground text-[13px] font-medium z-30 relative flex items-center gap-1.5">
                                <Repeat2 className="h-3.5 w-3.5 shrink-0" />
                                <Link href={reposterUserInfo.profilePath} className="hover:underline pointer-events-auto line-clamp-1" onClick={(e) => e.stopPropagation()}>
                                    {reposterUserInfo.username === currentUser?.username ? "Anda" : (reposterUserInfo.isRemote ? reposterUserInfo.handle : reposterUserInfo.username)} membagikan ulang
                                </Link>
                            </div>
                        )}
                        {!hideReplyIndicator && post.replyToId && !showConnector && (
                            <div className="text-[14px] text-muted-foreground mb-1.5 z-30 relative line-clamp-1">
                                {post.replyTo ? (() => {
                                    const replyUserInfo = getUserInfo(post.replyTo);
                                    return <>Membalas <Link href={replyUserInfo.profilePath} className="text-sky-500 hover:underline pointer-events-auto" onClick={(e) => e.stopPropagation()}>{replyUserInfo.handle}</Link></>;
                                })() : <span className="italic opacity-60">Membalas postingan yang telah dihapus</span>}
                            </div>
                        )}
                        {displayContent && (
                            <div className="text-[15px] md:text-[16px] text-foreground leading-relaxed relative z-30 pointer-events-none mb-1">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                    a: ({ node, ...props }) => <a {...props} className="text-sky-500 hover:underline pointer-events-auto" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} />,
                                    p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0 whitespace-pre-wrap" />,
                                    strong: ({ node, ...props }) => <strong {...props} className="font-bold text-foreground" />,
                                    em: ({ node, ...props }) => <em {...props} className="italic" />,
                                    code: ({ node, ...props }) => <code className="bg-accent px-1 py-0.5 rounded text-[0.9em] font-mono" />,
                                }}>
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
                    <div className="flex items-center justify-between mt-3 w-full z-30 relative pointer-events-none -ml-2">
                        <div className="flex-1 flex justify-start">
                            <InteractionButton icon={MessageSquare} label={targetPost.replyCount || ""} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsReplyOpen(true); }} className="pointer-events-auto" hoverColor="hover:text-sky-500" hoverBg="group-hover/btn:bg-sky-500/10" />
                        </div>
                        <div className="flex-1 flex justify-start">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto">
                                        <InteractionButton icon={Repeat2} label={targetPost.repostCount || ""} onClick={(e) => e.preventDefault()} hoverColor="hover:text-emerald-500" hoverBg="group-hover/btn:bg-emerald-500/10" active={targetPost.isRepostedByCurrentUser} activeColor="text-emerald-500" />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="bg-popover border-border text-popover-foreground z-[1000] shadow-xl">
                                    <DropdownMenuItem onClick={() => repostMutation.mutate()} className="cursor-pointer focus:bg-accent focus:text-emerald-500 py-2">
                                        <Repeat2 className="mr-2 h-4 w-4" />
                                        <span>{targetPost.isRepostedByCurrentUser ? "Batalkan Repost" : "Repost"}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsQuoteOpen(true); }} className="cursor-pointer focus:bg-accent focus:text-emerald-500 py-2">
                                        <PenLine className="mr-2 h-4 w-4" />
                                        <span>Quote</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="flex-1 flex justify-start">
                            <InteractionButton icon={Heart} label={likeCount || ""} onClick={() => likeMutation.mutate()} className="pointer-events-auto" hoverColor="hover:text-rose-500" hoverBg="group-hover/btn:bg-rose-500/10" active={hasLiked} activeColor="text-rose-500" fillActive />
                        </div>
                        <div className="flex-1 flex justify-start">
                            <InteractionButton icon={Bookmark} onClick={() => bookmarkMutation.mutate()} className="pointer-events-auto" hoverColor="hover:text-amber-500" hoverBg="group-hover/btn:bg-amber-500/10" active={isBookmarked} activeColor="text-amber-500" fillActive />
                        </div>
                        <div className="flex-1 flex justify-start">
                            <InteractionButton icon={Share2} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`); toast.success("Tautan disalin!"); }} className="pointer-events-auto" hoverColor="hover:text-sky-500" hoverBg="group-hover/btn:bg-sky-500/10" />
                        </div>
                    </div>
                </div>
            </div>
            {currentUser && isReplyOpen && <ReplyDialog isOpen={isReplyOpen} onClose={() => setIsReplyOpen(false)} parentPost={targetPost} currentUser={currentUser} onReplyCreated={(reply) => { if (onUpdate) onUpdate(reply); }} />}
            {currentUser && isQuoteOpen && <QuoteDialog isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} targetPost={targetPost} currentUser={currentUser} onQuoteCreated={(quote) => { if (onUpdate) onUpdate(quote); }} />}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-popover border-border text-popover-foreground z-[1100]">
                    <AlertDialogHeader><AlertDialogTitle>Hapus Postingan?</AlertDialogTitle><AlertDialogDescription className="text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-accent border-border text-foreground hover:bg-accent/80 hover:text-foreground">Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {displayAttachments && displayAttachments.length > 0 && (
                <ImageLightbox images={displayAttachments.map(a => ({ url: a.url, filename: a.key, type: a.fileType?.startsWith('video/') ? 'video' : 'image' }))} initialIndex={lightboxIndex} open={isLightboxOpen} onOpenChange={setIsLightboxOpen} />
            )}
        </div>
    );
}

function InteractionButton({ icon: Icon, label, onClick, hoverColor = "hover:text-foreground", hoverBg = "group-hover/btn:bg-accent", active, activeColor, activeBg, fillActive, className }: { icon: any, label?: string | number, onClick: (e: React.MouseEvent) => void, hoverColor?: string, hoverBg?: string, active?: boolean, activeColor?: string, activeBg?: string, fillActive?: boolean, className?: string }) {
    return (
        <button onClick={onClick} className={cn("flex items-center gap-1 transition-all group/btn outline-none", active ? (activeColor || "text-foreground") : cn("text-muted-foreground", hoverColor), className)}>
            <div className={cn("p-2 rounded-full transition-colors flex items-center justify-center", active ? (activeBg || "bg-accent") : hoverBg)}>
                <Icon className={cn("h-[18px] w-[18px]", active && fillActive && "fill-current")} />
            </div>
            {label !== undefined && label !== "" && <span className="text-[13px] font-medium pr-1">{label}</span>}
        </button>
    );
}
