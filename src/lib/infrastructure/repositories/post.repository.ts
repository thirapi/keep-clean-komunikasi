import { db } from "@/lib/db";
import { posts, postReactions, attachments as attachmentsTable } from "@/lib/infrastructure/drizzle/schema";
import { eq, desc, and, isNull, isNotNull } from "drizzle-orm";
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
        const [result] = await this.client.select().from(posts).where(and(eq(posts.id, id), eq(posts.isDeleted, false)));
        return (result as unknown as PostRecord) || null;
    }

    async findByIdWithDetails(id: string, currentUserId?: string): Promise<PostWithUserDTO | null> {
        const result = await this.client.query.posts.findFirst({
            where: and(eq(posts.id, id), eq(posts.isDeleted, false)),
            with: {
                user: {
                    columns: {
                        username: true,
                        avatar: true,
                        bio: true,
                        banner: true,
                        customStatus: true,
                    },
                },
                attachments: true,
                reactions: {
                    with: {
                        user: {
                            columns: {
                                username: true,
                            },
                        },
                    },
                },
                replyTo: {
                    with: {
                        user: {
                            columns: {
                                username: true,
                            },
                        },
                    },
                },
                repostOf: {
                    with: {
                        user: {
                            columns: {
                                username: true,
                                avatar: true,
                            },
                        },
                        attachments: true,
                    },
                },
            },
        });

        if (!result) return null;

        const dto = result as unknown as PostWithUserDTO;
        if (currentUserId) {
            dto.isLikedByCurrentUser = dto.reactions?.some(r => r.userId === currentUserId && r.emoji === "❤️");
            // Check if user has reposted THIS post
            // We'd need another query or check the global feed. 
            // For now, let's keep it simple or add a separate check
        }

        return dto;
    }

    async findRepost(userId: string, originalPostId: string): Promise<PostRecord | null> {
        const result = await this.client.query.posts.findFirst({
            where: and(
                eq(posts.userId, userId),
                eq(posts.repostOfId, originalPostId),
                eq(posts.isDeleted, false)
            )
        });
        return (result as unknown as PostRecord) || null;
    }

    async findByUserId(userId: string, currentUserId?: string, filter?: "threads" | "replies" | "reposts"): Promise<PostWithUserDTO[]> {
        let whereClause: any = and(eq(posts.userId, userId), eq(posts.isDeleted, false));

        if (filter === "threads") {
            whereClause = and(whereClause, eq(posts.replyToId, null as any));
        } else if (filter === "replies") {
            whereClause = and(whereClause, eq(posts.replyToId, posts.replyToId)); // IS NOT NULL logic
            // In Drizzle for Postgres/SQLite we use isNotNull(posts.replyToId)
        } else if (filter === "reposts") {
            whereClause = and(whereClause, eq(posts.repostOfId, posts.repostOfId)); // IS NOT NULL
        }

        const results = await this.client.query.posts.findMany({
            where: (posts, { and, eq, isNotNull, isNull }) => {
                const base = and(eq(posts.userId, userId), eq(posts.isDeleted, false));
                if (filter === "threads") return and(base, isNull(posts.replyToId));
                if (filter === "replies") return and(base, isNotNull(posts.replyToId));
                if (filter === "reposts") return and(base, isNotNull(posts.repostOfId));
                return base;
            },
            orderBy: [desc(posts.createdAt)],
            with: {
                user: {
                    columns: {
                        username: true,
                        avatar: true,
                        bio: true,
                        banner: true,
                        customStatus: true,
                    },
                },
                attachments: true,
                reactions: true,
                repostOf: {
                    with: {
                        user: {
                            columns: {
                                username: true,
                                avatar: true,
                            },
                        },
                        attachments: true,
                    },
                },
                replyTo: {
                    with: { user: { columns: { username: true } } }
                }
            },
        });

        return this.mapPostsWithStates(results as any, currentUserId);
    }

    async findReplies(postId: string, currentUserId?: string): Promise<PostWithUserDTO[]> {
        const results = await this.client.query.posts.findMany({
            where: and(eq(posts.replyToId, postId), eq(posts.isDeleted, false)),
            orderBy: [desc(posts.createdAt)],
            with: {
                user: {
                    columns: {
                        username: true,
                        avatar: true,
                        bio: true,
                        banner: true,
                        customStatus: true,
                    },
                },
                attachments: true,
                reactions: true,
            },
        });

        return this.mapPostsWithStates(results as any, currentUserId);
    }

    async getFollowingFeed(followingIds: string[], limit: number = 20, offset: number = 0, currentUserId?: string): Promise<PostWithUserDTO[]> {
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
                    columns: {
                        username: true,
                        avatar: true,
                        bio: true,
                        banner: true,
                        customStatus: true,
                    },
                },
                attachments: true,
                reactions: true,
                repostOf: {
                    with: {
                        user: {
                            columns: {
                                username: true,
                                avatar: true,
                            },
                        },
                        attachments: true,
                    },
                },
            },
        });

        return this.mapPostsWithStates(results as any, currentUserId);
    }

    async getGlobalFeed(limit: number = 20, offset: number = 0, currentUserId?: string): Promise<PostWithUserDTO[]> {
        const results = await this.client.query.posts.findMany({
            where: eq(posts.isDeleted, false),
            orderBy: [desc(posts.createdAt)],
            limit,
            offset,
            with: {
                user: {
                    columns: {
                        username: true,
                        avatar: true,
                        bio: true,
                        banner: true,
                        customStatus: true,
                    },
                },
                attachments: true,
                reactions: true,
                repostOf: {
                    with: {
                        user: {
                            columns: {
                                username: true,
                                avatar: true,
                            },
                        },
                        attachments: true,
                    },
                },
            },
        });

        return this.mapPostsWithStates(results as any, currentUserId);
    }

    private async mapPostsWithStates(results: any[], currentUserId?: string): Promise<PostWithUserDTO[]> {
        if (!currentUserId) return results as unknown as PostWithUserDTO[];

        // Fetch user's reposts
        const userReposts = await this.client.query.posts.findMany({
            where: and(eq(posts.userId, currentUserId), isNotNull(posts.repostOfId), eq(posts.isDeleted, false)),
            columns: { repostOfId: true }
        });
        const repostedIds = new Set(userReposts.map(r => r.repostOfId));

        return results.map(p => {
            const dto = p as unknown as PostWithUserDTO;
            const targetId = dto.repostOfId || dto.id;

            // If it's a repost, flags should reflect the ORIGINAL post
            dto.isLikedByCurrentUser = dto.reactions?.some(r => r.userId === currentUserId && r.emoji === "❤️");
            dto.isRepostedByCurrentUser = repostedIds.has(targetId);

            return dto;
        });
    }

    async addReaction(postId: string, userId: string, emoji: string): Promise<void> {
        await this.client.insert(postReactions).values({
            id: createId(),
            postId,
            userId,
            emoji,
        }).onConflictDoNothing();
    }

    async removeReaction(postId: string, userId: string, emoji: string): Promise<void> {
        await this.client
            .delete(postReactions)
            .where(
                and(
                    eq(postReactions.postId, postId),
                    eq(postReactions.userId, userId),
                    eq(postReactions.emoji, emoji)
                )
            );
    }
}

