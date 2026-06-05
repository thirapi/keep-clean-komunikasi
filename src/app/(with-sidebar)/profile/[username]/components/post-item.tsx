"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { ServerResponse } from "@/lib/entities/models/response.model";
import { toggleLikeAction, toggleReactionAction, repostAction, deletePostAction, toggleBookmarkAction } from "@/app/posts.action";
import { extractUrls } from "@/lib/extract-urls";

import { UserAvatar } from "@/components/ui/user-avatar";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { PostReactions } from "./post/post-reactions";
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

import { PostHeader } from "./post/post-header";
import { PostContent } from "./post/post-content";
import { PostActions } from "./post/post-actions";
import { PostStats } from "./post/post-stats";
import { ReplyDialog } from "./reply-dialog";
import { QuoteDialog } from "./quote-dialog";
import { Repeat2 } from "lucide-react";
import { parseFediverseContent } from "@/lib/fediverse-content-parser";

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
    
    // UI State
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isReplyOpen, setIsReplyOpen] = useState(false);
    const [isQuoteOpen, setIsQuoteOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Logic for Reposts and Quotes
    const isPureRepost = !post.content && !!post.repostOf && !post.attachments?.length;
    const isQuotePost = (!!post.content || !!post.attachments?.length) && (!!post.repostOf || !!post.quoteOf);
    const targetPost = isPureRepost && post.repostOf ? post.repostOf : post;

    // Derived Data
    const getUserInfo = (p: PostWithUserDTO) => {
        const u = p.user || p.remoteActor;
        const isRemote = !!p.remoteActor;
        const username = u?.username || "unknown";
        const domain = p.remoteActor?.domain;
        const handle = isRemote ? `@${username}@${domain}` : `@${username}`;
        const profilePath = isRemote ? `/profile/@${username}@${domain}` : `/profile/${username}`;
        const identifier = isRemote ? `@${username}@${domain}` : username;
        
        return { 
            id: (u as any)?.id,
            username, 
            identifier,
            avatar: u?.avatar || "/avatars/avatar1.png", 
            displayName: (u as any)?.name || (u as any)?.displayName || username, 
            handle, 
            profilePath, 
            isRemote, 
            domain,
            bio: (u as any)?.bio,
            banner: (u as any)?.banner,
            followersCount: (u as any)?.followersCount,
            followingCount: (u as any)?.followingCount,
            emojis: (u as any)?.emojis
        };
    };

    const displayUserInfo = getUserInfo(targetPost);
    const reposterUserInfo = isPureRepost ? getUserInfo(post) : null;
    const displayContent = targetPost.content;
    const createdAt = new Date(targetPost.createdAt);
    const displayAttachments = targetPost.attachments;
    const urls = useMemo(() => extractUrls(displayContent), [displayContent]);

    // Mutations
    const updatePostInCache = (postId: string, updateFn: (post: PostWithUserDTO) => PostWithUserDTO) => {
        queryClient.setQueriesData(
            { queryKey: ["posts"] },
            (oldData: any) => {
                if (!oldData) return oldData;
                const updateObject = (item: any) => {
                    if (!item) return item;
                    if (item.id === postId) return updateFn(item);
                    if (item.repostOf?.id === postId) return { ...item, repostOf: updateFn(item.repostOf) };
                    if (item.quoteOf?.id === postId) return { ...item, quoteOf: updateFn(item.quoteOf) };
                    if (item.replyTo?.id === postId) return { ...item, replyTo: updateFn(item.replyTo) };
                    return item;
                };

                if (Array.isArray(oldData)) return oldData.map(updateObject);

                // Support for PostDetailView's { post, replies, parents, thread } structure
                if (typeof oldData === 'object' && oldData.post) {
                    return {
                        ...oldData,
                        post: updateObject(oldData.post),
                        replies: oldData.replies?.map(updateObject),
                        parents: oldData.parents?.map(updateObject),
                        thread: oldData.thread?.map(updateObject),
                    };
                }

                return updateObject(oldData);
            }
        );
    };

    const likeMutation = useMutation({
        mutationFn: () => toggleLikeAction(targetPost.id, currentUserId!),
        onMutate: async () => {
            updatePostInCache(targetPost.id, (old) => {
                const isTogglingOff = !!old.isLikedByCurrentUser;
                const newReactions = (old.reactions || []).filter(r => r.userId !== currentUserId);
                
                if (!isTogglingOff) {
                    newReactions.push({ 
                        id: "temp", 
                        postId: old.id, 
                        userId: currentUserId!, 
                        emoji: "❤️", 
                        createdAt: new Date(), 
                        updatedAt: new Date(), 
                        user: { username: currentUser?.username || "me" } 
                    } as any);
                }

                return {
                    ...old,
                    isLikedByCurrentUser: !isTogglingOff,
                    reactions: newReactions
                };
            });
        },
        onError: () => toast.error("Gagal menyukai postingan"),
        onSuccess: (res: ServerResponse<PostWithUserDTO | null>) => { 
            if (res.status === "success" && res.data) {
                updatePostInCache(targetPost.id, () => res.data!); 
            }
        }
    });

    const repostMutation = useMutation({
        mutationFn: () => repostAction(targetPost.id, currentUserId!),
        onMutate: async () => {
            updatePostInCache(targetPost.id, (old) => ({
                ...old,
                isRepostedByCurrentUser: !old.isRepostedByCurrentUser,
                repostCount: old.isRepostedByCurrentUser ? (old.repostCount || 1) - 1 : (old.repostCount || 0) + 1
            }));
        },
        onSuccess: (res) => {
            if (res.status === "success" && res.data) {
                updatePostInCache(targetPost.id, () => res.data!);
                toast.success(res.data.isRepostedByCurrentUser ? "Berhasil membagikan ulang" : "Batal membagikan ulang");
                if (onUpdate) onUpdate(res.data);
                // Also specifically invalidate feed to show/hide the repost entry
                queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
            }
        },
        onError: () => toast.error("Gagal membagikan ulang")
    });

    const deleteMutation = useMutation({
        mutationFn: () => deletePostAction(post.id, currentUserId!),
        onSuccess: (res: ServerResponse<void>) => {
            if (res.status === "success") {
                toast.success("Postingan dihapus");
                setIsDeleteDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ["posts"] });
                queryClient.invalidateQueries({ queryKey: ["feed"] });
            }
        },
        onError: () => toast.error("Gagal menghapus postingan")
    });

    const bookmarkMutation = useMutation({
        mutationFn: () => toggleBookmarkAction(targetPost.id, currentUserId!),
        onMutate: async () => {
            updatePostInCache(targetPost.id, (old) => ({
                ...old,
                isBookmarkedByCurrentUser: !old.isBookmarkedByCurrentUser
            }));
        },
        onSuccess: (res: ServerResponse<PostWithUserDTO | null>) => {
            if (res.status === "success" && res.data) {
                updatePostInCache(targetPost.id, () => res.data!);
                toast.success(res.data?.isBookmarkedByCurrentUser ? "Disimpan ke bookmark" : "Dihapus dari bookmark");
            }
        }
    });

    const reactionMutation = useMutation({
        mutationFn: (emoji: string) => toggleReactionAction(targetPost.id, currentUserId!, emoji),
        onMutate: async (emoji) => {
            updatePostInCache(targetPost.id, (old) => {
                const existingReaction = old.reactions?.find(r => r.userId === currentUserId);
                const isTogglingOff = existingReaction?.emoji === emoji;

                const newReactions = (old.reactions || []).filter(r => r.userId !== currentUserId);
                if (!isTogglingOff) {
                    newReactions.push({ 
                        id: `temp-${Date.now()}`, 
                        postId: old.id, 
                        userId: currentUserId!, 
                        emoji, 
                        createdAt: new Date(), 
                        updatedAt: new Date(), 
                        user: { username: currentUser?.username || "me" } 
                    } as any);
                }

                return {
                    ...old,
                    reactions: newReactions,
                    isLikedByCurrentUser: emoji === "❤️" ? !isTogglingOff : false
                };
            });
        },
        onError: () => toast.error("Gagal menanggapi postingan"),
        onSuccess: (res: ServerResponse<PostWithUserDTO | null>) => { 
            if (res.status === "success" && res.data) {
                updatePostInCache(targetPost.id, () => res.data!);
            } 
        }
    });

    const groupedReactions = useMemo(() => {
        const groups: Record<string, { emoji: string; count: number; users: string[]; hasReacted: boolean }> = {};

        (targetPost.reactions || []).forEach((r) => {
            if (r.emoji === "❤️") return; // Keep heart for Like button only
            if (!groups[r.emoji]) {
                groups[r.emoji] = { emoji: r.emoji, count: 0, users: [], hasReacted: false };
            }
            groups[r.emoji].count++;
            
            let displayName = "Seseorang";
            if (r.userId === currentUserId) {
                displayName = "Anda";
            } else if (r.user?.username) {
                displayName = r.user.username;
            } else if (r.remoteActor?.username) {
                displayName = r.remoteActor.username;
            }
            
            groups[r.emoji].users.push(displayName);
            if (r.userId === currentUserId) {
                groups[r.emoji].hasReacted = true;
            }
        });

        Object.values(groups).forEach(g => {
            g.users.sort((a, b) => (a === "Anda" ? -1 : b === "Anda" ? 1 : 0));
        });

        return Object.values(groups);
    }, [targetPost.reactions, currentUserId]);

    const likers = useMemo(() => {
        return (targetPost.reactions || [])
            .filter(r => r.emoji === "❤️")
            .map(r => {
                if (r.userId === currentUserId) return "Anda";
                return r.user?.username || r.remoteActor?.username || "Seseorang";
            });
    }, [targetPost.reactions, currentUserId]);

    const hasLiked = !!targetPost.isLikedByCurrentUser;
    const likeCount = useMemo(() => {
        const baseCount = targetPost.reactions?.filter(r => r.emoji === "❤️").length || 0;
        const containsUser = targetPost.reactions?.some(r => r.userId === currentUserId && r.emoji === "❤️");
        if (targetPost.isLikedByCurrentUser && !containsUser) return baseCount + 1;
        if (!targetPost.isLikedByCurrentUser && containsUser) return Math.max(0, baseCount - 1);
        return baseCount;
    }, [targetPost.reactions, targetPost.isLikedByCurrentUser, currentUserId]);

    const reposters = useMemo(() => {
        const uniqueReposters = new Set<string>();
        (targetPost.reposts || []).forEach(r => {
            const name = r.user?.username || r.remoteActor?.username;
            if (name) uniqueReposters.add(name);
        });
        return Array.from(uniqueReposters);
    }, [targetPost.reposts]);

    const handleMediaClick = (idx: number) => {
        setLightboxIndex(idx);
        setIsLightboxOpen(true);
    };

    const lineX = "left-[31px] md:left-[39px]";
    const gutterWidth = "w-10 md:w-12";

    if (isFocused) {
        return (
            <div className="flex flex-col px-4 pt-4 pb-1 border-b border-border bg-background">
                {isPureRepost && reposterUserInfo && (
                    <div className="mb-2 text-muted-foreground text-[13px] font-medium flex items-center gap-1.5 ml-12 md:ml-14">
                        <Repeat2 className="h-3.5 w-3.5 shrink-0" />
                        <Link href={reposterUserInfo.profilePath} className="hover:underline line-clamp-1" onClick={(e) => e.stopPropagation()}>
                            {reposterUserInfo.username === currentUser?.username ? "Anda" : reposterUserInfo.displayName} membagikan ulang
                        </Link>
                    </div>
                )}
                <PostHeader 
                    user={displayUserInfo} 
                    createdAt={createdAt} 
                    visibility={targetPost.visibility} 
                    isFocused 
                    onDelete={() => setIsDeleteDialogOpen(true)}
                    onCopyLink={() => { navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`); toast.success("Tautan disalin!"); }}
                    isCurrentUser={post.userId === currentUserId}
                    currentUserId={currentUserId}
                    originalUrl={targetPost.url}
                />
                
                {!hideReplyIndicator && post.replyToId && (
                    <div className="text-[15px] text-muted-foreground mb-3">
                        {post.replyTo ? (
                            <>Membalas <Link href={getUserInfo(post.replyTo).profilePath} className="text-sky-500 hover:underline" onClick={(e) => e.stopPropagation()}>{getUserInfo(post.replyTo).handle}</Link></>
                        ) : (
                            <span className="italic opacity-60">Membalas postingan yang telah dihapus</span>
                        )}
                    </div>
                )}

                <PostContent 
                    content={displayContent} 
                    attachments={displayAttachments} 
                    onImageClick={handleMediaClick}
                    urls={urls}
                    linkPreviews={targetPost.linkPreviews}
                    emojis={targetPost.emojis}
                    apMetadata={targetPost.apMetadata}
                    isFocused
                />

                {isQuotePost && (post.repostOf || post.quoteOf) && (
                    <QuotePreview post={(post.repostOf || post.quoteOf)!} getUserInfo={getUserInfo} onImageClick={handleMediaClick} />
                )}

                <div className="py-4 text-muted-foreground text-[15px] flex items-center gap-1 cursor-default">
                    <time dateTime={createdAt.toISOString()}>
                        {format(createdAt, "HH.mm", { locale: id })} · {format(createdAt, "d MMM yy", { locale: id })}
                    </time>
                </div>

                <PostStats 
                    likeCount={likeCount} 
                    likers={likers}
                    repostCount={targetPost.repostCount} 
                    reposters={reposters}
                    replyCount={targetPost.replyCount}
                    isFocused
                    className="my-0"
                />

                <PostReactions 
                    reactions={groupedReactions} 
                    onToggleReaction={(emoji) => reactionMutation.mutate(emoji)} 
                    emojis={targetPost.emojis}
                />

                <PostActions 
                    isFocused
                    isLiked={hasLiked}
                    isReposted={targetPost.isRepostedByCurrentUser}
                    isBookmarked={targetPost.isBookmarkedByCurrentUser}
                    onLike={() => likeMutation.mutate()}
                    onRepost={() => repostMutation.mutate()}
                    onReply={() => setIsReplyOpen(true)}
                    onQuote={() => setIsQuoteOpen(true)}
                    onBookmark={() => bookmarkMutation.mutate()}
                    onShare={() => { navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`); toast.success("Tautan disalin!"); }}
                    onReactionSelect={(emoji) => reactionMutation.mutate(emoji)}
                    likeCount={likeCount}
                    likers={likers}
                    reposters={reposters}
                />

                {renderModals()}
            </div>
        );
    }

    const handleContainerClick = (e: React.MouseEvent) => {
        // Prevent navigation if the user is selecting text
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            return;
        }
        
        // Find the hidden link and click it to trigger NextTopLoader
        const link = (e.currentTarget as HTMLElement).querySelector(".post-item-link") as HTMLAnchorElement;
        if (link) {
            link.click();
        } else {
            router.push(`/posts/${post.id}`);
        }
    };

    return (
        <div 
            onClick={handleContainerClick} 
            className="flex flex-col border-b border-border/50 hover:bg-muted/10 transition-colors relative cursor-pointer"
        >
            {/* Hidden link for triggering NextTopLoader via programatic click */}
            <Link href={`/posts/${post.id}`} className="post-item-link hidden" aria-hidden="true" />

            {showConnector && (
                <div className={cn(
                    "absolute w-[2px] bg-border z-0", 
                    lineX, 
                    isFirstInChain ? (isPureRepost ? "top-[76px] bottom-0" : "top-[56px] bottom-0") : (isLastInChain ? "top-0 h-[36px]" : "top-0 bottom-0")
                )} />
            )}

            <div className="relative z-20 flex flex-col pt-3 pb-3 px-4">
                {isPureRepost && reposterUserInfo && (
                    <div className="mb-1 text-muted-foreground text-[13px] font-medium z-30 relative flex items-center gap-1.5 ml-10 md:ml-12">
                        <Repeat2 className="h-3.5 w-3.5 shrink-0" />
                        <Link href={reposterUserInfo.profilePath} className="hover:underline line-clamp-1" onClick={(e) => e.stopPropagation()}>
                            {reposterUserInfo.username === currentUser?.username ? "Anda" : reposterUserInfo.displayName} membagikan ulang
                        </Link>
                    </div>
                )}

                <div className="flex gap-0">
                    <div className={cn("shrink-0 z-30 relative flex flex-col items-center", gutterWidth)}>
                        <Link href={displayUserInfo.profilePath} className="hover:opacity-80 block" onClick={(e) => e.stopPropagation()}>
                            <UserAvatar src={displayUserInfo.avatar} className="h-10 w-10" />
                        </Link>
                    </div>

                    <div className="flex-1 min-w-0 pl-3 md:pl-4">
                        <PostHeader 
                            user={displayUserInfo} 
                            createdAt={createdAt} 
                            visibility={targetPost.visibility} 
                            onDelete={() => setIsDeleteDialogOpen(true)}
                            onCopyLink={() => { navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`); toast.success("Tautan disalin!"); }}
                            isCurrentUser={post.userId === currentUserId}
                            currentUserId={currentUserId}
                            originalUrl={targetPost.url}
                        />

                        {!hideReplyIndicator && post.replyToId && !showConnector && (
                            <div className="text-[14px] text-muted-foreground mb-1.5 z-30 relative line-clamp-1">
                                {post.replyTo ? (
                                    <>Membalas <Link href={getUserInfo(post.replyTo).profilePath} className="text-sky-500 hover:underline" onClick={(e) => e.stopPropagation()}>{getUserInfo(post.replyTo).handle}</Link></>
                                ) : (
                                    <span className="italic opacity-60">Membalas postingan yang telah dihapus</span>
                                )}
                            </div>
                        )}

                        <PostContent 
                            content={displayContent} 
                            attachments={displayAttachments} 
                            onImageClick={handleMediaClick}
                            urls={urls}
                            linkPreviews={targetPost.linkPreviews}
                            emojis={targetPost.emojis}
                            apMetadata={targetPost.apMetadata}
                        />

                        {isQuotePost && (post.repostOf || post.quoteOf) && (
                            <QuotePreview post={(post.repostOf || post.quoteOf)!} getUserInfo={getUserInfo} onImageClick={handleMediaClick} />
                        )}

                        <PostReactions 
                            reactions={groupedReactions} 
                            onToggleReaction={(emoji) => reactionMutation.mutate(emoji)} 
                            emojis={targetPost.emojis}
                        />

                        <PostActions 
                            replyCount={targetPost.replyCount}
                            repostCount={targetPost.repostCount}
                            likeCount={likeCount}
                            likers={likers}
                            reposters={reposters}
                            isLiked={hasLiked}
                            isReposted={targetPost.isRepostedByCurrentUser}
                            isBookmarked={targetPost.isBookmarkedByCurrentUser}
                            onLike={() => likeMutation.mutate()}
                            onRepost={() => repostMutation.mutate()}
                            onReply={() => setIsReplyOpen(true)}
                            onQuote={() => setIsQuoteOpen(true)}
                            onBookmark={() => bookmarkMutation.mutate()}
                            onShare={() => { navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`); toast.success("Tautan disalin!"); }}
                            onReactionSelect={(emoji) => reactionMutation.mutate(emoji)}
                        />
                    </div>
                </div>
            </div>

            {renderModals()}
        </div>
    );

    function renderModals() {
        return (
            <div onClick={(e) => e.stopPropagation()}>
                {currentUser && isReplyOpen && <ReplyDialog isOpen={isReplyOpen} onClose={() => setIsReplyOpen(false)} parentPost={targetPost} currentUser={currentUser} onReplyCreated={(reply) => { if (onUpdate) onUpdate(reply); }} />}
                {currentUser && isQuoteOpen && <QuoteDialog isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} targetPost={targetPost} currentUser={currentUser} onQuoteCreated={(quote) => { if (onUpdate) onUpdate(quote); }} />}
                
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent className="z-[1100]">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Postingan?</AlertDialogTitle>
                            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
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
}

function QuotePreview({ post, getUserInfo, onImageClick }: { post: PostWithUserDTO, getUserInfo: any, onImageClick: any }) {
    const userInfo = getUserInfo(post);

    return (
        <Link
            href={`/posts/${post.id}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-3 border border-border rounded-2xl p-3 flex flex-col gap-2 bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer overflow-hidden block"
        >
            <div className="flex items-center gap-2 mb-1">
                <UserAvatar src={userInfo.avatar} className="h-5 w-5" />
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-[14px] line-clamp-1" dangerouslySetInnerHTML={{ __html: parseFediverseContent(userInfo.displayName, userInfo.emojis) }} />
                    <span className="text-muted-foreground text-[13px]">{userInfo.handle}</span>
                </div>
            </div>
            <PostContent 
                content={post.content} 
                attachments={post.attachments} 
                onImageClick={onImageClick} 
                className="pointer-events-none" 
                emojis={post.emojis}
                isQuote
            />
        </Link>
    );
}
