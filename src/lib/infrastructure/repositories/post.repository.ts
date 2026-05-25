import { db } from "@/lib/db";
import { posts, postReactions, attachments as attachmentsTable } from "@/lib/infrastructure/drizzle/schema";
import { eq, desc, and, isNotNull, isNull } from "drizzle-orm";
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
                        reposts: { columns: { id: true } },
                        replies: { columns: { id: true } }
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

    async findByUserId(userId: string, currentUserId?: string, filter?: "threads" | "replies" | "reposts"): Promise<PostWithUserDTO[]> {
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
                    columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true },
                },
                attachments: true,
                reactions: true,
                repostOf: {
                    with: {
                        user: { columns: { username: true, avatar: true } },
                        attachments: true,
                        reactions: true,
                        reposts: { columns: { id: true } },
                        replies: { columns: { id: true } }
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
                repostOf: {
                    with: {
                        user: { columns: { username: true, avatar: true } },
                        attachments: true,
                        reactions: true,
                        reposts: { columns: { id: true } },
                        replies: { columns: { id: true } }
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

    async findParentChain(postId: string, currentUserId?: string): Promise<PostWithUserDTO[]> {
        const chain: PostWithUserDTO[] = [];
        let currentPostId: string | null = postId;

        let depth = 0;
        while (currentPostId && depth < 10) {
            const post = await this.findByIdWithDetails(currentPostId, currentUserId);
            if (!post || !post.replyToId) break;

            const parent = await this.findByIdWithDetails(post.replyToId, currentUserId);
            if (!parent) break;

            chain.unshift(parent);
            currentPostId = parent.id;
            depth++;
        }

        return chain;
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
                        reposts: { columns: { id: true } },
                        replies: { columns: { id: true } }
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

    async getGlobalFeed(limit: number = 20, offset: number = 0, currentUserId?: string): Promise<PostWithUserDTO[]> {
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
                        reposts: { columns: { id: true } },
                        replies: { columns: { id: true } }
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

    async getDiscoveryFeed(limit: number = 20, offset: number = 0, currentUserId?: string): Promise<PostWithUserDTO[]> {
        return this.getGlobalFeed(limit, offset, currentUserId);
    }

    private async mapPostsWithStates(results: any[], currentUserId?: string): Promise<PostWithUserDTO[]> {
        const repostedIds = new Set<string>();

        if (currentUserId) {
            const userReposts = await this.client.query.posts.findMany({
                where: and(
                    eq(posts.userId, currentUserId),
                    isNotNull(posts.repostOfId),
                    eq(posts.isDeleted, false),
                    eq(posts.content, "")
                ),
                columns: { repostOfId: true }
            });
            userReposts.forEach(r => { if (r.repostOfId) repostedIds.add(r.repostOfId); });
        }

        return results.map(p => {
            const dto = p as unknown as PostWithUserDTO;

            // Interaction logic: Pure Reposts share the original post's interactions
            const isPureRepost = !!p.repostOfId && p.content === "";
            const targetPost = (isPureRepost && p.repostOf) ? p.repostOf : p;
            const targetId = targetPost.id;

            dto.isLikedByCurrentUser = targetPost.reactions?.some((r: any) => r.userId === currentUserId && r.emoji === "❤️");
            dto.isRepostedByCurrentUser = repostedIds.has(targetId);

            // Robust Count: Use unique userIds for reposts to handle legacy duplicate data
            const uniqueRepostUserIds = new Set((targetPost.reposts || []).map((r: any) => r.userId));
            dto.repostCount = uniqueRepostUserIds.size;

            dto.replyCount = (targetPost.replies || []).length;

            // Ensure reactions are synced for Pure Repost
            if (isPureRepost && p.repostOf) {
                dto.reactions = p.repostOf.reactions;
            }

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
