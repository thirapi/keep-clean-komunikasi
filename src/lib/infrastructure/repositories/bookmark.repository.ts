import { IBookmarkRepository } from "@/lib/application/repositories/bookmark.repository.interface";
import { db } from "@/lib/db";
import { bookmarks, posts } from "@/lib/infrastructure/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { createId } from "@paralleldrive/cuid2";

export class BookmarkRepository implements IBookmarkRepository {
    constructor(private readonly _db: typeof db) { }

    async toggle(userId: string, postId: string): Promise<PostWithUserDTO> {
        const existing = await this._db.query.bookmarks.findFirst({
            where: and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)),
        });

        if (existing) {
            await this._db.delete(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)));
        } else {
            await this._db.insert(bookmarks).values({
                id: createId(),
                userId,
                postId,
            });
        }

        const post = await this._db.query.posts.findFirst({
            where: eq(posts.id, postId),
            with: {
                user: {
                    with: {
                        userRoles: { with: { role: true } }
                    }
                },
                remoteActor: true,
                attachments: true,
                reactions: { with: { user: { columns: { username: true } } } },
                repostOf: { 
                    with: { 
                        user: { columns: { username: true, avatar: true } },
                        remoteActor: true, 
                        attachments: true, 
                        bookmarks: true,
                        reactions: true,
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            columns: { id: true, userId: true }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        },
                    } 
                },
                replyTo: { 
                    with: { 
                        user: { columns: { username: true } }, 
                        bookmarks: true,
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            columns: { id: true, userId: true }
                        },
                    } 
                },
                bookmarks: true,
                reposts: { 
                    where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                    columns: { id: true, userId: true }
                },
                replies: { 
                    where: eq(posts.isDeleted, false),
                    columns: { id: true }
                },
            }
        });

        if (!post) throw new Error("Post not found");

        const mappedUser = post.user ? {
            ...post.user,
            role: (post.user as any).userRoles?.[0]?.role?.name || "User"
        } : {
            username: (post as any).remoteActor?.username || "unknown",
            avatar: (post as any).remoteActor?.avatar || "/avatars/avatar1.png",
            role: "Remote"
        };

        const result = {
            ...post,
            user: mappedUser,
            isLikedByCurrentUser: userId ? post.reactions?.some((r: any) => r.userId === userId && r.emoji === "❤️") : false,
            isRepostedByCurrentUser: userId ? post.reposts?.some((r: any) => r.userId === userId) : false,
            isBookmarkedByCurrentUser: !existing,
            replyCount: post.replies?.length || 0,
            repostCount: post.reposts?.length || 0,
            reactionCount: post.reactions?.length || 0,
        } as any;

        if (result.repostOf) {
            const r = result.repostOf;
            result.repostOf = {
                ...r,
                isLikedByCurrentUser: userId ? r.reactions?.some((re: any) => re.userId === userId && re.emoji === "❤️") : false,
                isRepostedByCurrentUser: userId ? r.reposts?.some((re: any) => re.userId === userId) : false,
                isBookmarkedByCurrentUser: userId ? r.bookmarks?.some((bo: any) => bo.userId === userId) : false,
                replyCount: r.replies?.length || 0,
                repostCount: r.reposts?.length || 0,
                reactionCount: r.reactions?.length || 0,
            };
        }

        return result as PostWithUserDTO;
    }

    async isBookmarked(userId: string, postId: string): Promise<boolean> {
        const existing = await this._db.query.bookmarks.findFirst({
            where: and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)),
        });
        return !!existing;
    }

    async getBookmarkedPosts(userId: string, limit: number, offset: number): Promise<PostWithUserDTO[]> {
        const results = await this._db.query.bookmarks.findMany({
            where: eq(bookmarks.userId, userId),
            limit,
            offset,
            orderBy: [desc(bookmarks.createdAt)],
            with: {
                post: {
                    with: {
                        user: {
                            with: {
                                userRoles: {
                                    with: {
                                        role: true
                                    }
                                }
                            }
                        },
                        attachments: true,
                        reactions: { with: { user: { columns: { username: true } } } },
                        repostOf: {
                            with: {
                                user: { columns: { username: true, avatar: true } },
                                attachments: true,
                                bookmarks: true,
                                reactions: true,
                                reposts: { 
                                    where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                                    columns: { id: true, userId: true }
                                },
                                replies: { 
                                    where: eq(posts.isDeleted, false),
                                    columns: { id: true }
                                },
                            }
                        },
                        replyTo: {
                            with: {
                                user: { columns: { username: true } },
                                bookmarks: true,
                                reposts: { 
                                    where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                                    columns: { id: true, userId: true }
                                },
                            }
                        },
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            columns: { id: true, userId: true }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        },
                        bookmarks: true,
                    }
                }
            }
        });

        // Map to PostWithUserDTO and add current user interaction states
        return results.map(b => {
            const p = b.post as any;
            
            const mappedPost = {
                ...p,
                user: {
                    ...p.user,
                    role: p.user.userRoles[0]?.role?.name || "User"
                },
                isLikedByCurrentUser: userId ? p.reactions?.some((r: any) => r.userId === userId && r.emoji === "❤️") : false,
                isRepostedByCurrentUser: userId ? p.reposts?.some((r: any) => r.userId === userId) : false,
                isBookmarkedByCurrentUser: true,
                replyCount: p.replies?.length || 0,
                repostCount: p.reposts?.length || 0,
                reactionCount: p.reactions?.length || 0,
            };

            if (mappedPost.repostOf) {
                const r = mappedPost.repostOf;
                mappedPost.repostOf = {
                    ...r,
                    isLikedByCurrentUser: userId ? r.reactions?.some((re: any) => re.userId === userId && re.emoji === "❤️") : false,
                    isRepostedByCurrentUser: userId ? r.reposts?.some((re: any) => re.userId === userId) : false,
                    isBookmarkedByCurrentUser: userId ? r.bookmarks?.some((bo: any) => bo.userId === userId) : false,
                    replyCount: r.replies?.length || 0,
                    repostCount: r.reposts?.length || 0,
                    reactionCount: r.reactions?.length || 0,
                };
            }

            return mappedPost as PostWithUserDTO;
        });
    }
}
