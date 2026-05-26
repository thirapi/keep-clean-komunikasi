import { db } from "@/lib/db";
import { posts, postReactions, attachments as attachmentsTable } from "@/lib/infrastructure/drizzle/schema";
import { eq, desc, and, isNotNull, isNull, exists, sql } from "drizzle-orm";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";
import { PostRecord, PostWithUserDTO } from "@/lib/entities/models/post.model";
import { createId } from "@paralleldrive/cuid2";

export class PostRepository implements IPostRepository {
    constructor(private client: typeof db) { }

    async create(post: PostRecord, attachments?: { url: string; key: string; fileType: string; size?: number }[]): Promise<PostRecord> {
        return await this.client.transaction(async (tx) => {
            const [result] = await tx.insert(posts).values({
                ...post,
            }).returning();

            if (attachments && attachments.length > 0) {
                await tx.insert(attachmentsTable).values(
                    attachments.map((a) => ({
                        id: createId(),
                        postId: post.id,
                        url: a.url,
                        key: a.key,
                        fileType: a.fileType,
                        size: a.size,
                    }))
                );
            }

            return result as unknown as PostRecord;
        });
    }

    async update(id: string, post: Partial<PostRecord>): Promise<PostRecord> {
        const [result] = await this.client
            .update(posts)
            .set({ ...post, updatedAt: new Date() })
            .where(eq(posts.id, id))
            .returning();
        return result as unknown as PostRecord;
    }

    async delete(id: string): Promise<void> {
        await this.client.update(posts).set({ isDeleted: true }).where(eq(posts.id, id));
    }

    async findById(id: string): Promise<PostRecord | null> {
        const [result] = await this.client.select().from(posts).where(eq(posts.id, id));
        return (result as unknown as PostRecord) || null;
    }

    async findRepost(userId: string, originalPostId: string): Promise<PostRecord | null> {
        const result = await this.client.query.posts.findFirst({
            where: and(
                eq(posts.userId, userId),
                eq(posts.repostOfId, originalPostId),
                eq(posts.isDeleted, false),
                eq(posts.content, "")
            )
        });
        return (result as unknown as PostRecord) || null;
    }

    async findByIdWithDetails(id: string, currentUserId?: string): Promise<PostWithUserDTO | null> {
        const result = await this.client.query.posts.findFirst({
            where: eq(posts.id, id),
            with: {
                user: {
                    columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true },
                },
                attachments: true,
                reactions: {
                    with: { user: { columns: { username: true } } },
                },
                replyTo: {
                    with: { user: { columns: { username: true } } },
                },
                repostOf: {
                    with: {
                        user: { columns: { username: true, avatar: true } },
                        attachments: true,
                        reactions: { with: { user: { columns: { username: true } } } },
                        reposts: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true, userId: true }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        }
                    },
                },
                reposts: {
                    where: eq(posts.isDeleted, false),
                    columns: { id: true, userId: true }
                },
                replies: {
                    where: eq(posts.isDeleted, false),
                    columns: { id: true }
                }
            },
        });

        if (!result) return null;

        const results = await this.mapPostsWithStates([result] as any, currentUserId);
        const dto = results[0];
        dto.isDeleted = result.isDeleted;

        return dto;
    }

    async findByUserId(userId: string, currentUserId?: string, filter?: "threads" | "replies" | "reposts" | "media", limit = 20, offset = 0): Promise<PostWithUserDTO[]> {
        const results = await this.client.query.posts.findMany({
            where: (posts, { and, eq, isNotNull, isNull }) => {
                const base = and(eq(posts.userId, userId), eq(posts.isDeleted, false));
                if (filter === "threads") return and(base, isNull(posts.replyToId));
                if (filter === "replies") return and(base, isNotNull(posts.replyToId));
                if (filter === "reposts") return and(base, isNotNull(posts.repostOfId));
                if (filter === "media") return and(base, exists(
                    this.client.select().from(attachmentsTable).where(eq(attachmentsTable.postId, posts.id))
                ));
                return base;
            },
            orderBy: [desc(posts.createdAt)],
            limit,
            offset,
            with: {
                user: {
                    columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true },
                },
                attachments: true,
                reactions: true,
                repostOf: {
                    with: {
                        user: { columns: { username: true, avatar: true } },
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true, userId: true }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        }
                    },
                },
                reposts: {
                    where: eq(posts.isDeleted, false),
                    columns: { id: true, userId: true }
                },
                replies: {
                    where: eq(posts.isDeleted, false),
                    columns: { id: true }
                },
                replyTo: { with: { user: { columns: { username: true } } } }
            },
        });

        return this.mapPostsWithStates(results as any, currentUserId);
    }

    async countByUserId(userId: string, filter?: "threads" | "replies" | "reposts" | "media"): Promise<number> {
        const result = await this.client
            .select({ count: sql<number>`count(*)` })
            .from(posts)
            .where(and(
                eq(posts.userId, userId),
                eq(posts.isDeleted, false),
                ...filter === "threads" ? [isNull(posts.replyToId)] : [],
                ...filter === "replies" ? [isNotNull(posts.replyToId)] : [],
                ...filter === "reposts" ? [isNotNull(posts.repostOfId)] : [],
                ...filter === "media" ? [exists(this.client.select().from(attachmentsTable).where(eq(attachmentsTable.postId, posts.id)))] : []
            ));
        return Number(result[0].count);
    }

    async findReplies(postId: string, currentUserId?: string): Promise<PostWithUserDTO[]> {
        const results = await this.client.query.posts.findMany({
            where: and(eq(posts.replyToId, postId), eq(posts.isDeleted, false)),
            orderBy: [desc(posts.createdAt)],
            with: {
                user: {
                    columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true },
                },
                attachments: true,
                reactions: true,
            }
        });
        return this.mapPostsWithStates(results as any, currentUserId);
    }

    async findParentChain(postId: string, currentUserId?: string): Promise<PostWithUserDTO[]> {
        const chain: PostWithUserDTO[] = [];
        let currentId: string | null = postId;

        while (currentId) {
            const post = await this.findByIdWithDetails(currentId, currentUserId);
            if (!post || !post.replyToId) break;
            currentId = post.replyToId;
            chain.unshift(post);
        }
        return chain;
    }

    async getGlobalFeed(limit = 20, offset = 0, currentUserId?: string): Promise<PostWithUserDTO[]> {
        const results = await this.client.query.posts.findMany({
            where: and(
                eq(posts.isDeleted, false),
                eq(posts.visibility, "public")
            ),
            orderBy: [desc(posts.createdAt)],
            limit,
            offset,
            with: {
                user: {
                    columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true },
                },
                attachments: true,
                reactions: true,
                replyTo: {
                    with: { user: { columns: { username: true } } },
                },
                repostOf: {
                    with: {
                        user: { columns: { username: true, avatar: true } },
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true, userId: true }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        }
                    },
                },
                reposts: {
                    where: eq(posts.isDeleted, false),
                    columns: { id: true, userId: true }
                },
                replies: {
                    where: eq(posts.isDeleted, false),
                    columns: { id: true }
                }
            },
        });
        return this.mapPostsWithStates(results as any, currentUserId);
    }

    async getFollowingFeed(followingIds: string[], limit = 20, offset = 0, currentUserId?: string): Promise<PostWithUserDTO[]> {
        const results = await this.client.query.posts.findMany({
            where: (posts, { and, eq, inArray }) => and(
                inArray(posts.userId, followingIds),
                eq(posts.isDeleted, false)
            ),
            orderBy: [desc(posts.createdAt)],
            limit,
            offset,
            with: {
                user: {
                    columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true },
                },
                attachments: true,
                reactions: true,
                replyTo: {
                    with: { user: { columns: { username: true } } },
                },
                repostOf: {
                    with: {
                        user: { columns: { username: true, avatar: true } },
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true, userId: true }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        }
                    },
                },
                reposts: {
                    where: eq(posts.isDeleted, false),
                    columns: { id: true, userId: true }
                },
                replies: {
                    where: eq(posts.isDeleted, false),
                    columns: { id: true }
                }
            },
        });

        return this.mapPostsWithStates(results as any, currentUserId);
    }

    async getDiscoveryFeed(limit = 20, offset = 0, currentUserId?: string): Promise<PostWithUserDTO[]> {
        // Simple discovery: show most reacted posts
        const results = await this.client.query.posts.findMany({
            where: and(
                eq(posts.isDeleted, false),
                eq(posts.visibility, "public")
            ),
            orderBy: [desc(posts.createdAt)],
            limit,
            offset,
            with: {
                user: {
                    columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true },
                },
                attachments: true,
                reactions: true,
                repostOf: {
                    with: {
                        user: { columns: { username: true, avatar: true } },
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true, userId: true }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        }
                    },
                },
                reposts: {
                    where: eq(posts.isDeleted, false),
                    columns: { id: true, userId: true }
                },
                replies: {
                    where: eq(posts.isDeleted, false),
                    columns: { id: true }
                }
            },
        });
        return this.mapPostsWithStates(results as any, currentUserId);
    }

    async addReaction(postId: string, userId: string, emoji: string): Promise<void> {
        await this.client.insert(postReactions).values({
            id: createId(),
            postId,
            userId,
            emoji
        }).onConflictDoNothing();
    }

    async removeReaction(postId: string, userId: string, emoji: string): Promise<void> {
        await this.client.delete(postReactions).where(
            and(
                eq(postReactions.postId, postId),
                eq(postReactions.userId, userId),
                eq(postReactions.emoji, emoji)
            )
        );
    }

    private async mapPostsWithStates(posts: any[], currentUserId?: string): Promise<PostWithUserDTO[]> {
        return posts.map(post => {
            const mappedPost = {
                ...post,
                isLikedByCurrentUser: currentUserId ? post.reactions?.some((r: any) => r.userId === currentUserId && r.emoji === "❤️") : false,
                isRepostedByCurrentUser: currentUserId ? post.reposts?.some((r: any) => r.userId === currentUserId) : false,
                replyCount: post.replies?.length || 0,
                repostCount: post.reposts?.length || 0,
                reactionCount: post.reactions?.length || 0,
            };

            if (mappedPost.repostOf) {
                mappedPost.repostOf = {
                    ...mappedPost.repostOf,
                    isLikedByCurrentUser: currentUserId ? mappedPost.repostOf.reactions?.some((r: any) => r.userId === currentUserId && r.emoji === "❤️") : false,
                    isRepostedByCurrentUser: currentUserId ? mappedPost.repostOf.reposts?.some((r: any) => r.userId === currentUserId) : false,
                    replyCount: mappedPost.repostOf.replies?.length || 0,
                    repostCount: mappedPost.repostOf.reposts?.length || 0,
                    reactionCount: mappedPost.repostOf.reactions?.length || 0,
                };
            }

            if (mappedPost.replyTo) {
                mappedPost.replyTo = {
                    ...mappedPost.replyTo,
                    isLikedByCurrentUser: currentUserId ? mappedPost.replyTo.reactions?.some((r: any) => r.userId === currentUserId && r.emoji === "❤️") : false,
                    isRepostedByCurrentUser: currentUserId ? mappedPost.replyTo.reposts?.some((r: any) => r.userId === currentUserId) : false,
                    replyCount: mappedPost.replyTo.replies?.length || 0,
                    repostCount: mappedPost.replyTo.reposts?.length || 0,
                    reactionCount: mappedPost.replyTo.reactions?.length || 0,
                };
            }

            return mappedPost;
        });
    }
}
